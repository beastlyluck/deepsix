// Edge control loop. Loads policy.pt, runs at a fixed rate, writes accel commands.
//
// Build:  cmake -S . -B build -DCMAKE_PREFIX_PATH=/path/to/libtorch && cmake --build build
// Run:    ./build/aerotwin_edge policy.pt 400
//
// Telemetry in, commands out over stdin/stdout so the FC bridge stays a one-liner.
// One drone per line: 12 floats of observation. Output: 3 floats of world accel.
#include <torch/script.h>

#include <chrono>
#include <iostream>
#include <sstream>
#include <thread>
#include <vector>

namespace {

constexpr int kObs = 12;
constexpr int kAct = 3;
constexpr float kAccLimit = 6.0f;

bool read_obs(std::vector<float>& out) {
  std::string line;
  if (!std::getline(std::cin, line)) return false;
  std::istringstream ss(line);
  out.clear();
  float v;
  while (ss >> v) out.push_back(v);
  return out.size() == kObs;
}

}  // namespace

int main(int argc, char** argv) {
  if (argc < 2) {
    std::cerr << "usage: aerotwin_edge policy.pt [rate_hz]\n";
    return 1;
  }
  const int rate_hz = argc > 2 ? std::atoi(argv[2]) : 400;
  const auto period = std::chrono::microseconds(1000000 / rate_hz);

  torch::jit::script::Module policy;
  try {
    policy = torch::jit::load(argv[1]);
  } catch (const c10::Error& e) {
    std::cerr << "could not load " << argv[1] << ": " << e.what() << "\n";
    return 2;
  }
  policy.eval();
  torch::NoGradGuard no_grad;

  std::vector<float> obs;
  auto next_tick = std::chrono::steady_clock::now();
  long late = 0, ticks = 0;

  while (read_obs(obs)) {
    auto x = torch::from_blob(obs.data(), {1, 1, kObs}).clone();
    auto y = policy.forward({x}).toTensor().clamp(-kAccLimit, kAccLimit);
    auto a = y.accessor<float, 3>();
    std::cout << a[0][0][0] << ' ' << a[0][0][1] << ' ' << a[0][0][2] << '\n';

    ++ticks;
    next_tick += period;
    auto now = std::chrono::steady_clock::now();
    if (now > next_tick) {
      ++late;               // missed the deadline; keep going, count it
      next_tick = now;
    } else {
      std::this_thread::sleep_until(next_tick);
    }
  }
  std::cerr << "ticks " << ticks << " late " << late << "\n";
  return 0;
}

cmake_minimum_required(VERSION 3.18)
project(aerotwin_edge CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif()

find_package(Torch REQUIRED)

add_executable(aerotwin_edge controller.cpp)
target_link_libraries(aerotwin_edge "${TORCH_LIBRARIES}")
target_compile_options(aerotwin_edge PRIVATE -O2 -fno-exceptions-in-hot-path)
set_property(TARGET aerotwin_edge PROPERTY CXX_STANDARD 17)

# Cross-compile hint for the companion computer:
#   cmake -S . -B build-arm -DCMAKE_TOOLCHAIN_FILE=aarch64.cmake \
#         -DCMAKE_PREFIX_PATH=/opt/libtorch-aarch64

"""Emit the dynamics MLP as an ONNX graph built node by node.

The phone runtime (Core ML / NNAPI via onnxruntime-mobile) evaluates f(z,u);
the RK4 loop stays in app code because it is four calls and a weighted sum,
and keeping it outside the graph lets the app change the step size when the
sensor cadence changes.
"""
import numpy as np
import onnx
from onnx import TensorProto, helper, numpy_helper


def export(theta, path):
    W1 = numpy_helper.from_array(theta["W1"].astype(np.float32), "W1")
    b1 = numpy_helper.from_array(theta["b1"].astype(np.float32), "b1")
    W2 = numpy_helper.from_array(theta["W2"].astype(np.float32), "W2")
    b2 = numpy_helper.from_array(theta["b2"].astype(np.float32), "b2")
    n_in, n_out = theta["W1"].shape[0], theta["W2"].shape[1]
    graph = helper.make_graph(
        [
            helper.make_node("MatMul", ["zu", "W1"], ["a1"]),
            helper.make_node("Add", ["a1", "b1"], ["a2"]),
            helper.make_node("Tanh", ["a2"], ["h"]),
            helper.make_node("MatMul", ["h", "W2"], ["o1"]),
            helper.make_node("Add", ["o1", "b2"], ["dz"]),
        ],
        "biosync_dynamics",
        [helper.make_tensor_value_info("zu", TensorProto.FLOAT, ["batch", n_in])],
        [helper.make_tensor_value_info("dz", TensorProto.FLOAT, ["batch", n_out])],
        initializer=[W1, b1, W2, b2],
    )
    model = helper.make_model(graph, producer_name="biosync", opset_imports=[helper.make_opsetid("", 17)])
    model.ir_version = 8
    onnx.checker.check_model(model)
    onnx.save(model, path)
    return model

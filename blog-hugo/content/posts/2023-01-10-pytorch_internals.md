---
title: A glimpse into PyTorch Autograd internals
date: '2023-01-10'
slug: a-glimpse-into-pytorch-autograd-internals-2023
summary: Trying to understand some errors we get, while using pyTorch
short_title: A glimpse into PyTorch Autograd inter...
thumbnail: /blogs/images/generated/pytorch.png
draft: false
---

## Intro

Here, we are going to discuss the internals of PyTorch `Autograd` module. The most of us don't have to know about this. I was the same till I came across this error:

```
unsupported operand type(s) for *: 'float' and 'NoneType'
```

This came from executing the following code:

```python
import torch
a = torch.tensor(5.0, requires_grad=True) * 0.1
b = torch.tensor(2.0, requires_grad=True)
c = a + b
c.backward()
a += + 0.1 * a.grad
```

But why? We defined that the gradient of `a` should be calculated by putting `requires_grad` to be `True`!

After some investigation, the error was due to that `a.grad` is `None`. But why is that the case? When we multiplied `a` by `0.1` we internally created a new tensor that is `intermediate`. And by default, PyTorch only populate gradients for `leaf` tensors only.

## Notes

These are some notes to help understand the internals of PyTorch, and its Autograd module, and why did we get this error.

**To know more about this, in a more structured way,read this blog post [here](https://medium.com/@mrityu.jha/understanding-the-grad-of-autograd-fc8d266fd6cf)**

- `requires_grad` tells PyTorch, if it should save the forward results, to use it to calculate the gradients.

- All tensors with `requires_grad` is `False` are leafs tensors.

- Tensors with `requires_grad` is `True` are leafs only if they are created by the user, and not as a result by a mathematical expression for example.

- When a tensor is created as a result of an operation on a few tensors, then it would be `leaf` if and only if all the tensor used to generate it has `requires_grad` set to `False`, as only then, the `requires_grad` for this tensor will be set to `False`, and as we mentioned above, it will be a leaf.

- For a tensor to have `tensor.grad` populated, it must have `requires_grad` to be `True`, and it must be a `leaf`.

- You can't change the `requires_grad` for `non-leaf` tensors. They are set automatically according the tensors used in the operation creating them

- PyTorch doesn't allow updates(in-place) on leaf tensors if the `requires_grad` is set to `True`, as it causes troubles in the backward pass.

- What does it mean, that Autograd will not populate the gradient for a tensor?
  - Here's what the backward graph does while calculating and propagating the gradient:
    - If this tensor has `requires_grad` set to `False`, then this tensor is not part of the backward graph, and it will do nothing.
    - If the tensor has `requires_grad` set to `True`, and `is_leaf` set to `False`, this means that this is an `intermediate` tensor that came off an operation. In this case, Autograd doesn't populate the `grad` attribute for this tensor, and just propagate the gradient to the operation that generated this tensor (to `grad_fn`.)
    - Lastly, if the tensor is a `leaf`, and has `requires_grad` set to `True`, then Autograd calculates the accumulated grad value, and puts it in `grad` field for the tensor.
  - There's an amazing video explaining this [here](https://www.youtube.com/watch?v=MswxJw-8PvE)

Now for the Solutions:

There are two solutions for this:

1. call `a.retain_grad()`, which tells PyTorch to keep the grad for this tensor anyway.
   - Note: this solution is not fast.
2. remove `requires_grad` from the initialization of the tensor, and then do it explicitly in a separate step.
3. wrap the weight update under `torch.no_grad`, and I will explain why we need this step below.

```python
import torch
a = torch.tensor(5.0) * 0.1
b = torch.tensor(2.0, requires_grad=True)
a.requires_grad = True
c = a + b
c.backward()
with torch.no_grad():
    a += + 0.1 * a.grad
```

## Normal training

Here's another script for a training a network with just one neuron. Our normal training system, would be something like this:

```python
# Input
a = torch.tensor(2.0)
# weight
w = torch.tensor(3.0, requires_grad=True)
# bias
b = torch.tensor(2.0, requires_grad=True)

for _ in range(10):
    # forward pass
    c = a * w +  b
    # backward pass
    c.backward()
    # weight update
    w =   w +  0.1*w.grad

```

This will not work!!

As we said, the weight update line, will produce an `intermediate` tensor, which the `grad` will not be populated for.
That's why we all wrap our weight updating steps under `torch.no_grad()` context, and do in-place calculation,which tells PyTorch not to keep track of these operations in the grad calculations, and thus the weights tensor will remain a `leaf` tensor.

```python
    with torch.no_grad():
        w +=   0.1*w.grad
```

- so we use `torch.no_grad()` for two main reasons:
  1. we don't need to include the weight update operation in the gradient graph.
     - although, we zero our gradient before every backward pass, but this weight update step will add a new branch in the gradient calculations for the weights tensors,and this will mess with the calculations.
  2. we need to be able to do `in-place` operation, and so, our tensor will remain a `leaf`, and Autograd will keep populating its gradient.

## Conclusion

At last, we usually, use pre-built optimizers for the training step, or we even use a `trainer`, which make the things way easier.
This was just a try to go back to the basics and trying to understand the roots of the problem.

## References

- https://PyTorch.org/docs/stable/generated/torch.Tensor.is_leaf.html#torch.Tensor.is_leaf
- https://www.youtube.com/watch?v=MswxJw-8PvE
- https://medium.com/@mrityu.jha/understanding-the-grad-of-Autograd-fc8d266fd6cf

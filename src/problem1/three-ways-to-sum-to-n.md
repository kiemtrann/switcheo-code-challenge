# Problem 1: Three ways to sum to n

<aside>
⏰ Duration: You should not spend more than **2 hours** on this problem.
*Time estimation is for internship roles, if you are a software professional you should spend significantly less time.*

</aside>

# Task

Provide 3 unique implementations of the following function in JavaScript.

**Input**: `n` - any integer

*Assuming this input will always produce a result lesser than `Number.MAX_SAFE_INTEGER`*.

**Output**: `return` - summation to `n`, i.e. `sum_to_n(5) === 1 + 2 + 3 + 4 + 5 === 15`.

```jsx
var sum_to_n_a = function(n) {
  let sum = 0;
  for (let i = 1; i <= n; i++) {
	  sum += i;
	}
	return sum;
};

var sum_to_n_b = function(n) {
	if (n === 1) {
    return 1;
  } else {
    return n + sum_to_n_b(n - 1);
  }
};

var sum_to_n_c = function(n) {
	return n * (n + 1) / 2;
};
```
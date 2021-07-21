// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

interface ITridentCallee {
    function tridentCallback(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        bytes calldata data
    ) external;
}

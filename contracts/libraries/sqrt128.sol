pragma solidity =0.6.12;
// @note sqrt for 128 bits of precision

contract Sqrt {
  function sqrt (uint x) public pure returns (uint y) {
    if (x > 0) {
      y = 1;
      uint z = x;
      if (z >= 0x100000000000000000000000000000000) { y <<= 64; z >>= 128; }
      if (z >= 0x10000000000000000) { y <<= 32; z >>= 64; }
      if (z >= 0x100000000) { y <<= 16; z >>= 32; }
      if (z >= 0x10000) { y <<= 8; z >>= 16; }
      if (z >= 0x100) { y <<= 4; z >>= 8; }
      if (z >= 0x10) { y <<= 2; z >>= 4; }
      if (z >= 0x4) { y <<= 1; }
      y = (x / y + y) / 2;
      y = (x / y + y) / 2;
      y = (x / y + y) / 2;
      y = (x / y + y) / 2;
      y = (x / y + y) / 2;
      y = (x / y + y) / 2;
      y = (x / y + y) / 2;
    } else y = 0;
  }
}

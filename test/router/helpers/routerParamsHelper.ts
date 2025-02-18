import { ethers } from "hardhat";

import { getBigNumber, MultiRoute } from "@sushiswap/tines";

import { RouteType } from "./constants";
import { ComplexPathParams, ExactInputParams, ExactInputSingleParams, InitialPath, Output, Path, PercentagePath, TridentRoute } from "./helperInterfaces";


export function getTridentRouterParams(multiRoute: MultiRoute, senderAddress: string): ExactInputParams | ExactInputSingleParams | ComplexPathParams {
    const routeType = getRouteType(multiRoute);
    let routerParams;
  
    switch (routeType) {
      case RouteType.SinglePool:
        routerParams = getExactInputSingleParams(multiRoute, senderAddress);
        break;
  
      case RouteType.SinglePath:
        routerParams = getExactInputParams(multiRoute, senderAddress, multiRoute.fromToken.address, multiRoute.toToken.address);
        break;
  
      case RouteType.ComplexPath:
      default:
        routerParams = getComplexPathParams(multiRoute, senderAddress, multiRoute.fromToken.address, multiRoute.toToken.address);
        break;
    }
    
    return routerParams;
}

function getRouteType(multiRoute: MultiRoute) { 
    if(multiRoute.legs.length === 1){
      return RouteType.SinglePool;
    }
  
    const routeInputTokens = multiRoute.legs.map(function (leg) { return leg.token.address});
  
    if((new Set(routeInputTokens)).size === routeInputTokens.length){
      return RouteType.SinglePath;
    }
  
    if((new Set(routeInputTokens)).size !== routeInputTokens.length){
      return RouteType.ComplexPath;
    }
  
    return "unknown";
}

function getRecipentAddress(multiRoute: MultiRoute, legIndex: number, fromTokenAddress: string, senderAddress: string): string {
    const isLastLeg = legIndex === multiRoute.legs.length - 1;
  
    if (isLastLeg || multiRoute.legs[legIndex + 1].token.address === fromTokenAddress) 
    {
      return senderAddress;
    } else 
    {
      return multiRoute.legs[legIndex + 1].address;
    }
}

function getExactInputSingleParams(multiRoute: MultiRoute, senderAddress: string) :ExactInputSingleParams {
    return {
        amountIn: getBigNumber(multiRoute.amountIn * multiRoute.legs[0].absolutePortion),
        amountOutMinimum: getBigNumber(0),
        tokenIn: multiRoute.legs[0].token.address,
        pool: multiRoute.legs[0].address,
        data: ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "bool"],
        [multiRoute.legs[0].token.address, senderAddress, false]
        ),
        routeType: RouteType.SinglePool
    }; 
}

function getExactInputParams(multiRoute: MultiRoute, senderAddress: string, fromToken: string, toToken: string) :ExactInputParams {
    const routeLegs = multiRoute.legs.length;
    let paths: Path[] = [];

    for (let legIndex = 0; legIndex < routeLegs; ++legIndex) {
        const recipentAddress = getRecipentAddress(
          multiRoute,
          legIndex,
          fromToken,
          senderAddress
        );
    
        if (multiRoute.legs[legIndex].token.address === fromToken) {
          const path: Path = { 
            pool: multiRoute.legs[legIndex].address,  
            data: ethers.utils.defaultAbiCoder.encode(
              ["address", "address", "bool"],
              [multiRoute.legs[legIndex].token.address, recipentAddress, false]
            ),
          };
          paths.push(path);

        } else 
        {
          const path: Path = { 
            pool: multiRoute.legs[legIndex].address, 
            data: ethers.utils.defaultAbiCoder.encode(
              ["address", "address", "bool"],
              [multiRoute.legs[legIndex].token.address, recipentAddress, false]
            ),
          };
          paths.push(path);
        }
      } 
  
    let inputParams: ExactInputParams = {
      tokenIn: multiRoute.legs[0].token.address,
      amountIn: getBigNumber(multiRoute.amountIn),
      amountOutMinimum: getBigNumber(0),
      path: paths,
      routeType: RouteType.SinglePath
    };
  
    return inputParams;
}

export function getComplexPathParams(multiRoute: MultiRoute, senderAddress: string, fromToken: string, toToken: string ): ComplexPathParams {
    let initialPaths: InitialPath[] = [];
    let percentagePaths: PercentagePath[] = [];
    let outputs: Output[] = [];
  
    const output: Output = {
      token: toToken,
      to: senderAddress,
      unwrapBento: false,
      minAmount: getBigNumber(0),
    };
    outputs.push(output);
  
    const routeLegs = multiRoute.legs.length;
  
    for (let legIndex = 0; legIndex < routeLegs; ++legIndex) {
      const recipentAddress = getRecipentAddress(
        multiRoute,
        legIndex,
        fromToken,
        senderAddress
      );
  
      if (multiRoute.legs[legIndex].token.address === fromToken) {
        const initialPath: InitialPath = {
          tokenIn: multiRoute.legs[legIndex].token.address,
          pool: multiRoute.legs[legIndex].address,
          amount: getBigNumber(multiRoute.amountIn * multiRoute.legs[legIndex].absolutePortion
          ),
          native: false,
          data: ethers.utils.defaultAbiCoder.encode(
            ["address", "address", "bool"],
            [multiRoute.legs[legIndex].token.address, recipentAddress, false]
          ),
        };
        initialPaths.push(initialPath);
      } else {
        const percentagePath: PercentagePath = {
          tokenIn: multiRoute.legs[legIndex].token.address,
          pool: multiRoute.legs[legIndex].address,
          balancePercentage: multiRoute.legs[legIndex].swapPortion * 1_000_000,
          data: ethers.utils.defaultAbiCoder.encode(
            ["address", "address", "bool"],
            [multiRoute.legs[legIndex].token.address, recipentAddress, false]
          ),
        };
        percentagePaths.push(percentagePath);
      }
    }
  
    const complexParams: ComplexPathParams = {
      initialPath: initialPaths,
      percentagePath: percentagePaths,
      output: outputs,
      routeType: RouteType.ComplexPath
    };
  
    return complexParams;
  }
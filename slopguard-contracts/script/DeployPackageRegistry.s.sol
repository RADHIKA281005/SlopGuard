// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {PackageRegistry} from "../src/PackageRegistry.sol";

contract DeployPackageRegistry is Script {
    function run() external returns (PackageRegistry) {
        vm.startBroadcast();

        PackageRegistry registry = new PackageRegistry();

        vm.stopBroadcast();

        return registry;
    }
}
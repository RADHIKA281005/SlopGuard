// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PackageRegistry} from "../src/PackageRegistry.sol";

contract PackageRegistryTest is Test {

    PackageRegistry registry;

    address owner = address(1);
    address user = address(2);

    function setUp() public {
        vm.prank(owner);
        registry = new PackageRegistry();
    }

    // ================= EXISTING FUNCTIONALITY =================

    function testRegisterPackage() public {
        vm.prank(owner);

        registry.registerPackage(
            "lodash",
            PackageRegistry.PackageStatus.SAFE
        );

        (
            string memory name,
            PackageRegistry.PackageStatus status,
            ,
            ,
            bool exists
        ) = registry.getPackage("lodash");

        assertEq(name, "lodash");
        assertEq(
            uint256(status),
            uint256(PackageRegistry.PackageStatus.SAFE)
        );
        assertTrue(exists);
    }

    function testUpdatePackageStatus() public {
        vm.startPrank(owner);

        registry.registerPackage(
            "suspicious-ai-package",
            PackageRegistry.PackageStatus.UNVERIFIED
        );

        registry.updatePackageStatus(
            "suspicious-ai-package",
            PackageRegistry.PackageStatus.CONFIRMED_HALLUCINATED
        );

        vm.stopPrank();

        PackageRegistry.PackageStatus status =
            registry.getPackageStatus("suspicious-ai-package");

        assertEq(
            uint256(status),
            uint256(
                PackageRegistry.PackageStatus.CONFIRMED_HALLUCINATED
            )
        );
    }

    function testNonOwnerCannotRegisterPackage() public {
        vm.prank(user);

        vm.expectRevert("Only owner can perform this action");

        registry.registerPackage(
            "malicious-package",
            PackageRegistry.PackageStatus.CONFIRMED_HALLUCINATED
        );
    }

    function testCannotRegisterDuplicatePackage() public {
        vm.startPrank(owner);

        registry.registerPackage(
            "axios",
            PackageRegistry.PackageStatus.SAFE
        );

        vm.expectRevert("Package already registered");

        registry.registerPackage(
            "axios",
            PackageRegistry.PackageStatus.SAFE
        );

        vm.stopPrank();
    }


    // ================= COMMUNITY REPORTING =================

    function testAnyoneCanReportPackage() public {
        vm.prank(user);

        registry.reportPackage("fake-ai-sdk");

        (
            string memory name,
            PackageRegistry.PackageStatus status,
            ,
            address reportedBy,
            bool exists
        ) = registry.getPackage("fake-ai-sdk");

        assertEq(name, "fake-ai-sdk");

        assertEq(
            uint256(status),
            uint256(PackageRegistry.PackageStatus.UNVERIFIED)
        );

        assertEq(reportedBy, user);

        assertTrue(exists);
    }


    function testReportedPackageStartsUnverified() public {
        vm.prank(user);

        registry.reportPackage("hallucinated-package");

        PackageRegistry.PackageStatus status =
            registry.getPackageStatus("hallucinated-package");

        assertEq(
            uint256(status),
            uint256(PackageRegistry.PackageStatus.UNVERIFIED)
        );
    }


    function testCannotReportDuplicatePackage() public {
        vm.prank(user);

        registry.reportPackage("duplicate-package");

        vm.prank(address(3));

        vm.expectRevert("Package already reported");

        registry.reportPackage("duplicate-package");
    }


    function testOnlyOwnerCanVerifyReportedPackage() public {
        // User reports package
        vm.prank(user);
        registry.reportPackage("suspicious-package");

        // Another user cannot verify it
        vm.prank(address(3));

        vm.expectRevert("Only owner can perform this action");

        registry.updatePackageStatus(
            "suspicious-package",
            PackageRegistry.PackageStatus.CONFIRMED_HALLUCINATED
        );

        // Owner can verify it
        vm.prank(owner);

        registry.updatePackageStatus(
            "suspicious-package",
            PackageRegistry.PackageStatus.CONFIRMED_HALLUCINATED
        );

        PackageRegistry.PackageStatus status =
            registry.getPackageStatus("suspicious-package");

        assertEq(
            uint256(status),
            uint256(
                PackageRegistry.PackageStatus.CONFIRMED_HALLUCINATED
            )
        );
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PackageRegistry {

    enum PackageStatus {
        UNVERIFIED,
        SAFE,
        CONFIRMED_HALLUCINATED
    }

    struct Package {
        string name;
        PackageStatus status;
        uint256 reportedAt;
        address reportedBy;
        bool exists;
    }

    mapping(string => Package) private packages;

    address public owner;

    event PackageRegistered(
        string packageName,
        PackageStatus status,
        address reportedBy
    );

    event PackageReported(
        string packageName,
        address reportedBy
    );

    event PackageStatusUpdated(
        string packageName,
        PackageStatus oldStatus,
        PackageStatus newStatus
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only owner can perform this action"
        );
        _;
    }
//================IMPORTANT FUNCTIONS===================

//==================REGISTER PACKAGE===================
    // Owner can directly register a package
    // with a verified status.
    function registerPackage(
        string memory _packageName,
        PackageStatus _status
    ) public onlyOwner {

        require(
            !packages[_packageName].exists,
            "Package already registered"
        );

        packages[_packageName] = Package({
            name: _packageName,
            status: _status,
            reportedAt: block.timestamp,
            reportedBy: msg.sender,
            exists: true
        });

        emit PackageRegistered(
            _packageName,
            _status,
            msg.sender
        );
    }

//=================REPORT PACKAGE=======================
    // Anyone can report a suspicious package.
    // Reports start as UNVERIFIED.
    function reportPackage(
        string memory _packageName
    ) public {

        require(
            !packages[_packageName].exists,
            "Package already reported"
        );

        packages[_packageName] = Package({
            name: _packageName,
            status: PackageStatus.UNVERIFIED,
            reportedAt: block.timestamp,
            reportedBy: msg.sender,
            exists: true
        });

        emit PackageReported(
            _packageName,
            msg.sender
        );
    }

//==============UPDATE PACKAGE=================
    // Only owner can verify/update a package.
    function updatePackageStatus(
        string memory _packageName,
        PackageStatus _newStatus
    ) public onlyOwner {

        require(
            packages[_packageName].exists,
            "Package not found"
        );

        PackageStatus oldStatus =
            packages[_packageName].status;

        packages[_packageName].status =
            _newStatus;

        emit PackageStatusUpdated(
            _packageName,
            oldStatus,
            _newStatus
        );
    }

//==================GET PACKAGE==============
    function getPackage(
        string memory _packageName
    )
        public
        view
        returns (
            string memory,
            PackageStatus,
            uint256,
            address,
            bool
        )
    {
        Package memory packageInfo =
            packages[_packageName];

        return (
            packageInfo.name,
            packageInfo.status,
            packageInfo.reportedAt,
            packageInfo.reportedBy,
            packageInfo.exists
        );
    }

    function getPackageStatus(
        string memory _packageName
    )
        public
        view
        returns (PackageStatus)
    {
        require(
            packages[_packageName].exists,
            "Package not found"
        );

        return packages[_packageName].status;
    }
}
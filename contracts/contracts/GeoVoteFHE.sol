// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title GeoVoteFHE
 * @notice Landmark voting DApp contract using FHEVM features.
 *         - Stores BOTH clear votes (public transparency) and encrypted votes (FHE demo)
 *         - One address can vote once per landmark
 *         - Admin can add landmarks
 */
contract GeoVoteFHE is ZamaEthereumConfig {
    struct Landmark {
        string name;
        string country;
        string imageUrl;
        int64 latMicro;   // latitude * 1e6
        int64 lngMicro;   // longitude * 1e6
        // Public counter (for PRD transparency and easy sorting on frontend)
        uint256 votes;
        // Encrypted counter (FHE demonstration)
        euint32 votesEnc;
        mapping(address => bool) voted;
    }

    Landmark[] private _landmarks;
    address public admin;

    event LandmarkAdded(
        uint256 indexed id,
        string name,
        string country,
        string imageUrl,
        int64 latMicro,
        int64 lngMicro,
        address indexed addedBy
    );
    event Voted(uint256 indexed id, address indexed voter, uint256 votesAfter);
    event ViewerGranted(uint256 indexed id, address indexed viewer);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function getLandmarkCount() external view returns (uint256) {
        return _landmarks.length;
    }

    function addLandmark(
        string memory name,
        string memory country,
        string memory imageUrl,
        int64 latMicro,
        int64 lngMicro
    ) external onlyAdmin returns (uint256 id) {
        id = _landmarks.length;
        Landmark storage lm = _landmarks.push();
        lm.name = name;
        lm.country = country;
        lm.imageUrl = imageUrl;
        lm.latMicro = latMicro;
        lm.lngMicro = lngMicro;
        lm.votes = 0;
        // lm.votesEnc defaults to 0 (encrypted zero)

        emit LandmarkAdded(id, name, country, imageUrl, latMicro, lngMicro, msg.sender);
    }

    /**
     * @notice Vote for a landmark with FHE input (typically encrypt 1).
     * @param id Landmark id
     * @param encOne External encrypted uint32 (should be 1) provided by frontend
     * @param inputProof Zero-knowledge input proof
     */
    function vote(
        uint256 id,
        externalEuint32 encOne,
        bytes calldata inputProof
    ) external {
        require(id < _landmarks.length, "Invalid id");
        Landmark storage lm = _landmarks[id];
        require(!lm.voted[msg.sender], "Already voted");

        // Mark voted
        lm.voted[msg.sender] = true;
        // Public votes increment (for transparent ranking)
        lm.votes += 1;

        // FHE encrypted add
        euint32 oneEncrypted = FHE.fromExternal(encOne, inputProof);
        lm.votesEnc = FHE.add(lm.votesEnc, oneEncrypted);

        // Allow contract itself and voter to decrypt latest handle
        FHE.allowThis(lm.votesEnc);
        FHE.allow(lm.votesEnc, msg.sender);

        emit Voted(id, msg.sender, lm.votes);
    }

    /**
     * @notice Grant the caller permission to decrypt the current encrypted votes of a landmark.
     *         Non-view because permission changes are applied.
     */
    function grantViewVotes(uint256 id) external {
        require(id < _landmarks.length, "Invalid id");
        Landmark storage lm = _landmarks[id];
        FHE.allow(lm.votesEnc, msg.sender);
        emit ViewerGranted(id, msg.sender);
    }

    /**
     * @notice Read-only landmark public info (no encrypted data in return).
     */
    function getLandmark(uint256 id)
        external
        view
        returns (
            string memory name,
            string memory country,
            string memory imageUrl,
            int64 latMicro,
            int64 lngMicro,
            uint256 votes
        )
    {
        require(id < _landmarks.length, "Invalid id");
        Landmark storage lm = _landmarks[id];
        return (lm.name, lm.country, lm.imageUrl, lm.latMicro, lm.lngMicro, lm.votes);
    }

    /**
     * @notice Returns the encrypted votes handle for a landmark.
     */
    function getVotesHandle(uint256 id) external view returns (euint32) {
        require(id < _landmarks.length, "Invalid id");
        return _landmarks[id].votesEnc;
    }

    function hasVoted(uint256 id, address user) external view returns (bool) {
        require(id < _landmarks.length, "Invalid id");
        return _landmarks[id].voted[user];
    }
}



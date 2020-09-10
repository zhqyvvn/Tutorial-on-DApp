let Passcard = artifacts.require("./Passcard.sol");

module.exports = function(deployer) {
  deployer.deploy(Passcard);
};

let Passcard = artifacts.require("./Passcard.sol");

contract("Passcard", function(accounts) {
  let passcardInstance;

  it("initializes with four museums", function() {
    return Passcard.deployed().then(function(instance) {
      return instance.museumsCount();
    }).then(function(count) {
      assert.equal(count, 4);
    });
  });

  it("it initializes the museums with the correct values", function() {
    return Passcard.deployed().then(function(instance) {
      passcardInstance = instance;
      return passcardInstance.museums(1);
    }).then(function(museum) {

      assert.equal(museum[0], 1, "contains the correct id");
      assert.equal(museum[1], "Royal Ontario Museum", "contains the correct name");
      assert.equal(museum[2], "It is one of the largest museums in North America and the largest in Canada.", "contains the correct description");
      assert.equal(museum[3], "100 Queens Park, Toronto, ON", "contains the correct address");
      assert.equal(museum[4], "Mon-Fri, 10a.m.-5:30p.m.", "contains the correct hours");
      assert.equal(museum[5], "./images/on_royal.jpg", "contains the correct img path");
      assert.equal(museum[6], "2020-09-15", "contains the correct expiration date");
      assert.equal(museum[7], 10, "contains the correct number of pass cards");

      return passcardInstance.museums(2);
    }).then(function(museum) {

      assert.equal(museum[0], 2, "contains the correct id");
      assert.equal(museum[1], "Gardiner Museum", "contains the correct name");
      assert.equal(museum[2], "The collection is made up of two types of ceramics, earthenware, and porcelain.", "contains the correct description");
      assert.equal(museum[3], "111 Queens Park, Toronto, ON", "contains the correct address");
      assert.equal(museum[4], "Mon-Fri, 10a.m.-6:00p.m.", "contains the correct hours");
      assert.equal(museum[5], "./images/gardiner.jpg", "contains the correct img path");
      assert.equal(museum[6], "2020-10-08", "contains the correct expiration date");
      assert.equal(museum[7], 30, "contains the correct number of pass cards");

      return passcardInstance.museums(3);
    }).then(function(museum) {

      assert.equal(museum[0], 3, "contains the correct id");
      assert.equal(museum[1], "Art Gallery of Ontario", "contains the correct name");
      assert.equal(museum[2], "Its permanent collection represents many artistic movements and eras of art history.", "contains the correct description");
      assert.equal(museum[3], "317 Dundas St W, Toronto, ON", "contains the correct address");
      assert.equal(museum[4], "Mon-Fri, 10:30a.m.-5p.m.", "contains the correct hours");
      assert.equal(museum[5], "./images/ago.jpg", "contains the correct img path");
      assert.equal(museum[6], "2020-11-20", "contains the correct expiration date");
      assert.equal(museum[7], 25, "contains the correct number of pass cards");

      return passcardInstance.museums(4);
    }).then(function(museum) {

      assert.equal(museum[0], 4, "contains the correct id");
      assert.equal(museum[1], "Textile Museum of Canada", "contains the correct name");
      assert.equal(museum[2], "It is a museum dedicated to the collection, exhibition, and documentation of textiles.", "contains the correct description");
      assert.equal(museum[3], "55 Centre Ave, Toronto, ON", "contains the correct address");
      assert.equal(museum[4], "Mon-Sun, 11a.m.-5p.m.", "contains the correct hours");
      assert.equal(museum[5], "./images/textile.jpg", "contains the correct img path");
      assert.equal(museum[6], "2020-12-16", "contains the correct expiration date");
      assert.equal(museum[7], 1, "contains the correct number of pass cards");
    });
  });

  it("allows a user to get and remove a pass card", function() {
    return Passcard.deployed().then(function(instance) {
      passcardInstance = instance;
      museumId = 1;
      return passcardInstance.getPasscard(museumId, { from: accounts[0] });
    }).then(function(receipt) {
      return passcardInstance.users(accounts[0]);
    }).then(function(userinfo) {
      assert.equal(userinfo.passcardsCount, 1, "increments the user's pass card count");
      return passcardInstance.getPcValid.call(museumId, { from: accounts[0] });
    }).then(function(valid_status){
      assert.equal(valid_status, true, "the user got the pass card of museum1");
      return passcardInstance.removePasscard(museumId, { from: accounts[0] });
    }).then(function(receipt) {
      return passcardInstance.users(accounts[0]);
    }).then(function(userinfo) {
      assert.equal(userinfo.passcardsCount, 0, "deducts the user's pass card count");
      return passcardInstance.getPcValid.call(museumId, { from: accounts[0] });
    }).then(function(valid_status) {
      assert.equal(valid_status, false, "the user removed the pass card of museum1");
    });
  });

  it("the number of remaining pass cards for museums varies when the user gets one or removes one", function(){
    return Passcard.deployed().then(function(instance) {
      passcardInstance = instance;
      museumId = 1;
      return passcardInstance.getPasscard(museumId, { from: accounts[0] });
    }).then(function(receipt) {
      return passcardInstance.museums(museumId);
    }).then(function(museum) {
      assert.equal(museum[7], 9, "decrease the count of pass cards left for museum1");
      return passcardInstance.removePasscard(museumId, { from: accounts[0] });
    }).then(function(receipt) {
      return passcardInstance.museums(museumId);
    }).then(function(museum) {
      assert.equal(museum[7], 10, "increment the count of pass cards left for museum1");
    });
  });

  // write a test to ensure that our getPasscard function throws an exception for invalid museum id:
  it("throws an exception for invalid museum id in getPasscard", function() {
    return Passcard.deployed().then(function(instance) {
      passcardInstance = instance;
      return passcardInstance.getPasscard(99, { from: accounts[1] })
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    })
  });

  it("throws an exception for getting same passcard twice", function() {
    return Passcard.deployed().then(function(instance) {
      passcardInstance = instance;
      museumId = 2;
      return passcardInstance.getPasscard(museumId, { from: accounts[1] });
    }).then(function(receipt) {
      return passcardInstance.users(accounts[1]);
    }).then(function(userinfo) {
      assert.equal(userinfo.passcardsCount, 1, "gets first passcard");
      return passcardInstance.getPcValid.call(museumId, { from: accounts[1] });
    }).then(function(valid_status){
      assert.equal(valid_status, true, "passcard of museum2 is valid");
      // Try to get same passcard again
      return passcardInstance.getPasscard(museumId, { from: accounts[1] });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    });
  });

  it("throws an exception when the count of remaining pass cards is zero for a museum but the user still tries to get one", function() {
    return Passcard.deployed().then(function(instance) {
      passcardInstance = instance;
      museumId = 4;
      return passcardInstance.getPasscard(museumId, { from: accounts[1] });
    }).then(function(receipt) {
      return passcardInstance.getPasscard(museumId, { from: accounts[1] });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    });
  });

  it("throws an exception for invalid museum id in removePasscard", function() {
    return Passcard.deployed().then(function(instance) {
      passcardInstance = instance;
      return passcardInstance.removePasscard(99, { from: accounts[1] })
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    });
  });

  it("throws an exception for users removing invalid pass cards", function() {
    return Passcard.deployed().then(function(instance) {
      passcardInstance = instance;
      museumId = 1;
      return passcardInstance.removePasscard(museumId, { from: accounts[2] });
    }).then(assert.fail).catch(function(error) {
      assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    });
  });

  it("the getPcEvent and removePcEvent is triggered correcly", function() {
    return Passcard.deployed().then(function(instance) {
      passcardInstance = instance;
      museumId = 1;
      return passcardInstance.getPasscard(museumId, { from: accounts[0] });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "an getPc event was triggered");
      assert.equal(receipt.logs[0].event, "getPcEvent", "the getPc event type is correct");
      assert.equal(receipt.logs[0].args._museumId.toNumber(), museumId, "the museum id got is correct");
      return passcardInstance.removePasscard(museumId, { from: accounts[0] });
    }).then(function(receipt) {
      assert.equal(receipt.logs.length, 1, "an remove event was triggered");
      assert.equal(receipt.logs[0].event, "removePcEvent", "the remove event type is correct");
      assert.equal(receipt.logs[0].args._museumId.toNumber(), museumId, "the museum id removed is correct");
    });
  });
});

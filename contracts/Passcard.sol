pragma solidity 0.5.16;

contract Passcard {

  //Model a Museum
  struct Museum {
    uint id;
    string name;
    string description;
    string addr;
    string hour;
    string imgsrc;
    string expire_date;
    uint count_remain;
  }

  // Model the user information
  struct UserInfo {
    uint passcardsCount;
    mapping(uint => bool) passcardsValid;
    bool exist;
  }

  //Read/Write museums' information
  mapping(uint => Museum) public museums;

  //keep track of museum counts
  uint public museumsCount;

  // Read/Write users' information
  mapping(address => UserInfo) public users;

  //Constructor
  constructor() public {
    //add mock data
    addMuseum("Royal Ontario Museum",
    "It is one of the largest museums in North America and the largest in Canada.",
    "100 Queens Park, Toronto, ON", "Mon-Fri, 10a.m.-5:30p.m.", "./images/on_royal.jpg", "2020-09-15", 10);

    addMuseum("Gardiner Museum",
    "The collection is made up of two types of ceramics, earthenware, and porcelain.",
    "111 Queens Park, Toronto, ON", "Mon-Fri, 10a.m.-6:00p.m.", "./images/gardiner.jpg", "2020-10-08", 30);

    addMuseum("Art Gallery of Ontario",
    "Its permanent collection represents many artistic movements and eras of art history.",
    "317 Dundas St W, Toronto, ON", "Mon-Fri, 10:30a.m.-5p.m.", "./images/ago.jpg", "2020-11-20", 25);

    addMuseum("Textile Museum of Canada",
    "It is a museum dedicated to the collection, exhibition, and documentation of textiles.",
    "55 Centre Ave, Toronto, ON", "Mon-Sun, 11a.m.-5p.m.", "./images/textile.jpg", "2020-12-16", 1);
  }

  //function for adding museum
  function addMuseum (string memory _name, string memory _description,
    string memory _addr, string memory _hours, string memory _imgsrc,
    string memory _date, uint _count) private {
      museumsCount += 1;
      museums[museumsCount] = Museum(museumsCount, _name, _description, _addr, _hours,
        _imgsrc, _date, _count);
    }

  function getPasscard (uint _museumId) public {

    if (!users[msg.sender].exist) {
      // initialize user information
      users[msg.sender] = UserInfo({passcardsCount: 0, exist: true});
    } else {
      // require that the user can't get the same pass card twice
      require(!users[msg.sender].passcardsValid[_museumId]);
    }

    // require a valid museumId
    require(_museumId > 0 && _museumId <= museumsCount);

    //require the number of remaining pass cards for the museum is larger than zero
    require(museums[_museumId].count_remain > 0);

    // record that user got the pass card
    users[msg.sender].passcardsValid[_museumId] = true;

    // update count of pass cards for that user
    users[msg.sender].passcardsCount += 1;

    //update the number of remaining pass cards for the museum
    museums[_museumId].count_remain -= 1;

    /*direct automatically after getting passcard*/
    emit getPcEvent(_museumId);

  }

  function removePasscard (uint _museumId) public {
    // require the user exists in mapping and got passcards before
    require(users[msg.sender].exist);

    // require that the user has the passcard with id _museumId
    require(users[msg.sender].passcardsValid[_museumId]);

    // require a valid museumId
    require(_museumId > 0 && _museumId <= museumsCount);

    // record that user removes the passcard
    users[msg.sender].passcardsValid[_museumId] = false;

    // update count of passcards for that user
    users[msg.sender].passcardsCount -= 1;

    //update the number of remaining pass cards for the museum
    museums[_museumId].count_remain += 1;

    /*direct automatically after getting passcard*/
    emit removePcEvent(_museumId);

  }

  //check if the user has the pass card of the museum with id _museumId
  function getPcValid (uint _museumId) public returns (bool) {
    return (users[msg.sender].passcardsValid[_museumId]);
  }

  event getPcEvent (
    uint indexed _museumId
  );

  event removePcEvent (
    uint indexed _museumId
  );
}

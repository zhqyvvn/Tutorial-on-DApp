App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: async function() {
    return await App.initWeb3();
  },

  initWeb3: async function() {
  if (window.ethereum) {
      App.web3Provider = window.ethereum;
      await window.ethereum.enable();
      web3 = new Web3(App.web3Provider);
      return App.initContract();
    }
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
      return App.initContract();
    }
  },

  initContract: function() {
    $.getJSON("Passcard.json", function(passcard) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Passcard = TruffleContract(passcard);
      // Connect provider to interact with contract
      App.contracts.Passcard.setProvider(App.web3Provider);

      /*direct automatically after users' operations*/
      App.listenForEvents();

      return App.render();
    });
  },

  getPasscard: function(e) {
    let museumId = parseInt(e.target.id.slice(0, 2));
    App.contracts.Passcard.deployed().then(function(instance) {
      return instance.getPasscard(museumId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },

  removePasscard: function(e) {
    let museumId = parseInt(e.target.id.slice(0, 2));
    App.contracts.Passcard.deployed().then(function(instance) {
      return instance.removePasscard(museumId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },

  listenForEvents: function() {
    App.contracts.Passcard.deployed().then(function(instance) {
      // listen for all events from latest block
      instance.allEvents({fromBlock:'latest'})
        .watch(function(error, event) {
        // Reload when the user got new pass card or the user deleted a pass card
        App.render();
      });
    });
  },

  render: function() {
    let passcardInstance;
    let loader = $("#loader");
    let content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Passcard.deployed().then(function(instance) {
      passcardInstance = instance;
      return passcardInstance.museumsCount();
    }).then(async function(museumsCount) {
      console.log(`museumsCount: ${museumsCount}`)

      let museums_promises = [];
      for (let i = 1; i <= museumsCount; i++) {
        museums_promises.push(passcardInstance.museums(i));
      }

      let museums_array = await Promise.all(museums_promises);

      let museumsListing = $("#card_museums");
      museumsListing.empty();

      for (let i = 0; i < museumsCount; i++) {
          let museum = museums_array[i];

          let id = museum[0];
          let name = museum[1];
          let description = museum[2];
          let addr = museum[3];
          let hour = museum[4];
          let imgsrc = museum[5];
          let expire_date = museum[6];
          let count_remain = museum[7];

          // Render museums in DOM
          let card_museum = document.createElement("div");
          card_museum.className = "card_museum";

          let leftcol = document.createElement("div");
          leftcol.className = "left";

          let imgcontainer = document.createElement("div");
          imgcontainer.className = "image";

          let img = document.createElement("img");
          img.src = imgsrc;
          img.alt = name;

          imgcontainer.appendChild(img);
          leftcol.appendChild(imgcontainer);
          card_museum.appendChild(leftcol);

          let rightcol = document.createElement("div");
          rightcol.className = "right";

          let card_title = document.createElement("h5");
          card_title.className = "card-title";

          let title_text = document.createElement("strong");
          title_text.appendChild(document.createTextNode(name));

          card_title.appendChild(title_text);
          rightcol.appendChild(card_title);

          let card_desc = document.createElement("p");
          card_desc.className = "card-text";
          card_desc.appendChild(document.createTextNode(description));
          rightcol.appendChild(card_desc);

          let card_addr_hour = document.createElement("p");
          card_addr_hour.className = "card-text";

          let card_addr = document.createElement("strong");
          card_addr.appendChild(document.createTextNode("Address: "));
          let addr_text = document.createTextNode(addr);
          let br = document.createElement("br");
          card_addr_hour.appendChild(card_addr);
          card_addr_hour.appendChild(addr_text);
          card_addr_hour.appendChild(br);

          let card_hour = document.createElement("strong");
          card_hour.appendChild(document.createTextNode("Hours: "));
          let hour_text = document.createTextNode(hour);
          card_addr_hour.appendChild(card_hour);
          card_addr_hour.appendChild(hour_text);

          rightcol.appendChild(card_addr_hour);

          let card_note = document.createElement("p");
          card_note.className = "card-text card-note";
          card_note.appendChild(document.createTextNode("Pass card will be expired by "));
          let date_text = document.createElement("span");
          date_text.setAttribute("id", "date");
          date_text.appendChild(document.createTextNode(expire_date));
          card_note.appendChild(date_text);

          rightcol.appendChild(card_note);

          let card_button = document.createElement("div");
          card_button.className = "card-button";
          card_button.appendChild(document.createTextNode("only "));

          let amount = document.createElement("span");
          amount.setAttribute("id", "amount");
          amount.appendChild(document.createTextNode(count_remain));

          card_button.appendChild(amount);
          card_button.appendChild(document.createTextNode(" pass cards left !"));

          let button_valid = document.createElement("button");
          button_valid.setAttribute("id", `${id}-valid`);
          button_valid.type = "button";
          button_valid.className = "btn btn-primary";
          button_valid.onclick = App.getPasscard;
          if (count_remain <= 0) {
            button_valid.disabled = true;
          } else {
            button_valid.disabled = false;
          }
          button_valid.appendChild(document.createTextNode("Get !"));

          card_button.appendChild(button_valid);

          rightcol.appendChild(card_button);

          card_museum.appendChild(rightcol);

          museumsListing.append(card_museum);

      }

      return passcardInstance.users.call(App.account);
    }).then(async function(userinfo){
      let passcardsCount = document.getElementById("count");
      passcardsCount.innerHTML = userinfo[0];
      console.log(`passcardsCount: ${userinfo[0]}`)

      let museumsCount = await passcardInstance.museumsCount();

      let boolean_promises = [];
      for (let i = 1; i <= museumsCount; i++) {
        boolean_promises.push(passcardInstance.getPcValid.call(i, {from: App.account}));
      }

      let boolean_array = await Promise.all(boolean_promises);

      // console.log(boolean_array)

      let museum_promises = [];
      for (let i = 1; i <= museumsCount; i++) {
        if (boolean_array[i - 1]) {
          museum_promises.push(passcardInstance.museums(i));
        }
      }

      let museum_array = await Promise.all(museum_promises);
      let museum_array_length = museum_array.length;

      let userCardsListing = $("#user_cards");
      userCardsListing.empty();

      // console.log(museum_array)

      for (let i = 0; i < museum_array_length; i++) {

        let museum = museum_array[i];

        let museumId = museum[0];
        let name = museum[1];
        let description = museum[2];
        let addr = museum[3];
        let hour = museum[4];
        let imgsrc = museum[5]
        let expire_date = museum[6];
        let count_remain = museum[7];

        // disable buttons in museum cards if the user already got the pass card
        let button_will_disable = document.getElementById(`${museumId}-valid`);
        if (button_will_disable) {
          button_will_disable.disabled = true;
        }

        // Render museums in DOM
        let card_museum = document.createElement("div");
        card_museum.className = "user_card card_museum";

        let leftcol = document.createElement("div");
        leftcol.className = "left";

        let imgcontainer = document.createElement("div");
        imgcontainer.className = "image";

        let img = document.createElement("img");
        img.src = imgsrc;
        img.alt = name;

        imgcontainer.appendChild(img);
        leftcol.appendChild(imgcontainer);
        card_museum.appendChild(leftcol);

        let rightcol = document.createElement("div");
        rightcol.className = "right";

        let card_title = document.createElement("h5");
        card_title.className = "card-title";

        let title_text = document.createElement("strong");
        title_text.appendChild(document.createTextNode(name));

        card_title.appendChild(title_text);
        rightcol.appendChild(card_title);

        let card_desc = document.createElement("p");
        card_desc.className = "card-text";
        card_desc.appendChild(document.createTextNode(description));
        rightcol.appendChild(card_desc);

        let card_addr_hour = document.createElement("p");
        card_addr_hour.className = "card-text";

        let card_addr = document.createElement("strong");
        card_addr.appendChild(document.createTextNode("Address: "));
        let addr_text = document.createTextNode(addr);
        let br = document.createElement("br");
        card_addr_hour.appendChild(card_addr);
        card_addr_hour.appendChild(addr_text);
        card_addr_hour.appendChild(br);

        let card_hour = document.createElement("strong");
        card_hour.appendChild(document.createTextNode("Hours: "));
        let hour_text = document.createTextNode(hour);
        card_addr_hour.appendChild(card_hour);
        card_addr_hour.appendChild(hour_text);

        rightcol.appendChild(card_addr_hour);

        let card_note = document.createElement("p");
        card_note.className = "card-text card-note";
        card_note.appendChild(document.createTextNode("Pass card will be expired by "));
        let date_text = document.createElement("span");
        date_text.setAttribute("id", "date");
        date_text.appendChild(document.createTextNode(expire_date));
        card_note.appendChild(date_text);

        rightcol.appendChild(card_note);

        let enjoy_text = document.createElement("div");
        enjoy_text.className = "card-button";
        enjoy_text.appendChild(document.createTextNode("ENJOY !"));

        let button_remove = document.createElement("button");
        button_remove.setAttribute("id", `${museumId}-remove`);
        button_remove.type = "button";
        button_remove.className = "btn btn-danger";
        button_remove.onclick = App.removePasscard;
        button_remove.appendChild(document.createTextNode("Remove"));

        enjoy_text.appendChild(button_remove);

        rightcol.appendChild(enjoy_text);

        card_museum.appendChild(rightcol);

        userCardsListing.append(card_museum);
      }

      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});

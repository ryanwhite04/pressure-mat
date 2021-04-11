export default class Port {

  constructor(device) {
    this.device_ = device;
    this.interfaceNumber = 0;
    this.endpointIn = 0;
    this.endpointOut = 0;
  }

  disconnect() {
    return this.device_.controlTransferOut({
        'requestType': 'class',
        'recipient': 'interface',
        'request': 0x22,
        'value': 0x00,
        'index': this.interfaceNumber})
    .then(() => this.device_.close());
  }

  send(data) {
    console.log('sending', data, this.device_, this.endpointOut);
    return this.device_.transferOut(this.endpointOut, data);
  }
  connect() {
    let readLoop = () => {
      this.device_.transferIn(this.endpointIn, 64).then(result => {
        this.onReceive(result.data);
        readLoop();
      }, error => {
        this.onReceiveError(error);
      });
    };

    return this.device_.open()
    .then(() => this.device_.configuration || this.device_.selectConfiguration(1))
    .then(() => {
      var interfaces = this.device_.configuration.interfaces;
      interfaces.forEach(element => {
        element.alternates.forEach(elementalt => {
          if (elementalt.interfaceClass==0xFF) {
            this.interfaceNumber = element.interfaceNumber;
            elementalt.endpoints.forEach(ee => {
              if (ee.direction == "out") this.endpointOut = ee.endpointNumber;
              if (ee.direction == "in") this.endpointIn = ee.endpointNumber;
            })
          }
        })
      })
    })
    .then(() => this.device_.claimInterface(this.interfaceNumber))
    .then(() => this.device_.selectAlternateInterface(this.interfaceNumber, 0))
    .then(() => this.device_.controlTransferOut({
        requestType: 'class',
        recipient: 'interface',
        request: 0x22,
        value: 0x01,
        index: this.interfaceNumber
     }))
    .then(readLoop);
  }

}
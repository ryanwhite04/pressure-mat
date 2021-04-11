import { Port, rough, LitElement, html, css } from './modules.bundle.js';
class PressureMat extends LitElement {
  static get properties() {
    return {
      connected: { type: Boolean },
      wheels: { type: Array },
      pedals: { type: Array },
      size: { type: Number },
    }
  }
  constructor() {
    super();
    this.connected = false;
    this.wheels = localStorage.wheels ? JSON.parse(localStorage.wheels) : [];
    this.pedals = localStorage.pedals ? JSON.parse(localStorage.pedals) : [];
    this.size = localStorage.size ? JSON.parse(localStorage.size) : 26;
    this.width = this.height = 192;
  }
  async request() {
    return new Port(await navigator.usb.requestDevice({ filters: [
      { vendorId: 0x239A }, // Adafruit boards
      { vendorId: 0xcafe }, // TinyUSB example
    ] }));
  }
  connectedCallback() {
    super.connectedCallback();
    console.log('Starting', event);
    navigator.usb.getDevices()
      .then(devices => devices.map(device => new Port(device)))
      .then(ports => {
        if (ports.length) {
          this.port = ports[0];
        } else console.log("no ports");
      });
  }
  connect(port) {
    console.log("Connecting to Port: ", port, this);
    let receive = this.receive;
    port.connect().then(() => {
      console.log("Connected to port: ", port)
      port.onReceive = this.receive(this);
      port.onReceiveError = console.error;
    }, console.error);
  }
  disconnect(port) {
    console.log("Disconnecting from Port: ", port);
    port.disconnect();
  }
  receive(element) {
    console.log('received', { element });
    return data => {
      let textDecoder = new TextDecoder();
      let decoded = textDecoder.decode(data);
      console.log('received data', decoded);
      let received = parseInt(decoded);
      if (!isNaN(received)) {
        if (received) {
          element[received % 2 ? "wheels" : "pedals"].unshift(Date.now());
        } else {
          this.connected = true;
        }
        element.requestUpdate();
      }
      return received
    }
  }
  toggle() {
    if (this.connected) {
      this.disconnect(this.port)
      this.connected = false;
    } else {
      this.request()
      .then(selected => (this.port = selected))
      .then(() => this.connect(this.port))
      .catch(console.error);
    }
  }
  firstUpdated() {
    // this.drawWheelCanvas(this.shadowRoot.getElementById('canvas'), this.width, this.height);
    this.drawWheelSVG(this.shadowRoot.getElementById('svg'), this.width, this.height);
  }
  drawWheelCanvas(canvas, w, h) {
    this.rc = rough.canvas(canvas);
    this.rc.rectangle(w/8, h/8, 6*w/8, 6*h/8);
    this.rc.ellipse(w/2, h/2, 5*w/8, 5*h/8, {
      fill: "rgb(16, 16, 16)",
      fillWeight: 2,
    }); // centerX, centerY, diameter
    this.rc.ellipse(w/2, h/2, w/2, h/2, {
      fill: "rgb(255, 255, 255)",
      fillStyle: 'solid',
    }); // centerX, centerY, diameter
    for (let i = 0; i < 16; i++) {
      this.rc.line(w/2, h/2, w/2 + w/4*Math.cos(i*Math.PI/8), h/2 + h/4*Math.sin(i*Math.PI/8)); // x1, y1, x2, y2     
    }
  }
  drawWheelSVG(svg, w, h) {
    let rs = rough.svg(svg);
    svg.appendChild(rs.rectangle(w/8, h/8, 6*w/8, 6*h/8));
    svg.appendChild(rs.ellipse(w/2, h/2, 5*w/8, 5*h/8, {
      fill: "rgb(16, 16, 16)",
      fillWeight: 2,
    })); // centerX, centerY, diameter
    svg.appendChild(rs.ellipse(w/2, h/2, w/2, h/2, {
      fill: "rgb(255, 255, 255)",
      fillStyle: 'solid',
    })); // centerX, centerY, diameter
    for (let i = 0; i < 16; i++) {
      svg.appendChild(rs.line(w/2, h/2, w/2 + w/4*Math.cos(i*Math.PI/8), h/2 + h/4*Math.sin(i*Math.PI/8))); // x1, y1, x2, y2     
    }
  }
  wheel() {
    this.wheels.unshift(Date.now());
    localStorage.setItem('wheels', JSON.stringify(this.wheels));
    this.requestUpdate();
  }
  pedal() {
    this.pedals.unshift(Date.now());
    localStorage.setItem('pedals', JSON.stringify(this.pedals));
    this.requestUpdate();
  }
  get circumference() {
    return Math.PI*0.0254*this.size;
  }
  get distance() {
    return parseInt(this.circumference * this.wheels.length);
  }
  get wheelTime() {
    return this.wheels.length > 1 ?
      this.wheels[0] - this.wheels[1] :
      0;
  }
  get speed() {
    return this.wheelTime ? parseInt(3600 * this.circumference / this.wheelTime) : 0;
  }
  get speedAverage() {
    const time = this.wheels.length > 1 ?
      (this.wheels[0] - this.wheels[this.wheels.length - 1]) / this.wheels.length:
      0;
    return time ? parseInt(3600 * this.circumference / time) : 0;
  }
  get pedalTime() {
    return this.pedals.length > 1 ?
      this.pedals[0] - this.pedals[1] :
      0;
  }
  get cadence() {
    console.log('cadence', this.pedalTime);;
    return this.pedalTime ? parseInt(60000/this.pedalTime) : 0;
  }
  get cadenceAverage() {
    const time = this.pedals.length > 1 ?
      (this.pedals[0] - this.pedals[this.pedals.length - 1]) / this.pedals.length :
      0;
    console.log('cadence', this.pedalTime);;
    return time ? parseInt(60000/time) : 0;
  }
  reset() {
    this.wheels = [];
    localStorage.setItem('wheels', JSON.stringify(this.wheels));
    this.pedals = [];
    localStorage.setItem('pedals', JSON.stringify(this.pedals));
  }
  updateSize(event) {
    this.size = event.detail.value;
    localStorage.setItem('size', JSON.stringify(this.size));
  }
  static get styles() {
    return css`
      svg {
        display: block;
        margin: auto;
      }
      svg > g:not(:first-child) {
        animation-name: spin;
        animation-iteration-count: infinite;
        animation-timing-function: linear;
        animation-duration: var(--animationDuration);
        transform-origin: 50% 50%;
      }
      @keyframes spin {
        from { transform:rotate(0deg); }
        to { transform:rotate(360deg); }
      }
      label {
        display: block;
        font-size: larger;    
      }
      wired-slider {
        display: block;
        margin: auto;
      }
      .large {
        font-size: xx-large;
      }
    `;
  }
  render() {
    return html`
      <style>
        svg {
          --animationDuration: ${this.wheelTime}ms;
        }
      </style>
      <wired-button @click=${this.reset}>Reset</wired-button>
      <wired-button @click=${this.pedal}>Pedal</wired-button>
      <wired-button @click=${this.wheel}>Wheel</wired-button>
      <wired-button @click=${this.toggle}>${this.connected ? "Disconnect" : "Connect"}</wired-button>
      <p>Distance Travelled</p>
      <p class="large">${this.distance}m</p>
      <p>Speed</p><p class="large">${this.speed} km/h</p>
      <p>Average Speed</p><p class="large">${this.speedAverage} km/h</p>
      <p>Cadence</p><p class="large">${this.cadence} rpm</p>
      <p>Average Cadence</p><p class="large">${this.cadenceAverage} RPM</p>
      <svg width=${this.width} height=${this.height} id="svg"></svg>
      <label for="size">Wheel Size
        <wired-slider id="size" step="0.5" knobradius="15" value=${this.size} @change=${this.updateSize} min="16" max="36"></wired-slider>
      </label>
      <p>Diameter: ${this.size} Inches</p>
      <p>Circumference: ${parseInt(100 * this.circumference)/100}m</p>
    `;
  }
}

function plot(err, rows) {

    function unpack(rows, key) {
      return rows.map(function(row) { return row[key]; });
    }

    plot = Plotly.newPlot('plot', [{ z: [
        [0.1, 0.2, 0.6, 0.3],
        [0.1, 0.3, 0.8, 0.5],
        [0.9, 0.8, 0.7, 0.1],
        [1, 0.1, 0.9, 0.2],
    ], type: 'surface' }], {
      title: 'Pressure',
      autosize: false,
      width: 500,
      height: 500,
      margin: {
        l: 65,
        r: 50,
        b: 65,
        t: 90,
      }
    });
    console.log(plot);
    return plot;
}

customElements.define('pressure-mat', PressureMat);
const path = 'https://raw.githubusercontent.com/plotly/datasets/master/api_docs/mt_bruno_elevation.csv';
Plotly.d3.csv(path, plot);

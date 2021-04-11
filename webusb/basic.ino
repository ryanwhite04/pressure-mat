#include <Adafruit_TinyUSB.h>
Adafruit_USBD_WebUSB webusb;
WEBUSB_URL_DEF(landingPage, 1, "speedence.com");

int wheel = 1;
int pedal = 2;
void setup() {
  pinMode(12, INPUT_PULLUP);
  pinMode(13, INPUT_PULLUP);
  webusb.setLandingPage(&landingPage); // When plugged in to compatible devices, will ask user to go to this page
  webusb.setLineStateCallback(line_state_callback); // I don't know what this does to be honest
  webusb.begin(); // Start up usb_web
  Serial.begin(115200);
  while(!USBDevice.mounted()) delay(1);
  attachInterrupt(digitalPinToInterrupt(12), sendWheel, FALLING);
  attachInterrupt(digitalPinToInterrupt(13), sendPedal, FALLING);
}

void loop() {}
void sendWheel() { wheel += 2; Serial.print(wheel); webusb.print(wheel); }
void sendPedal() { pedal += 2; Serial.print(pedal); webusb.print(pedal); }
void line_state_callback(bool connected) { if (connected) { Serial.print(0); webusb.print(0); } }

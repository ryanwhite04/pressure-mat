/*********************************************************************
 Adafruit invests time and resources providing this open source code,
 please support Adafruit and open-source hardware by purchasing
 products from Adafruit!

 MIT license, check LICENSE for more information
 Copyright (c) 2019 Ha Thach for Adafruit Industries
 All text above, and the splash screen below must be included in
 any redistribution
*********************************************************************/
#include <Adafruit_TinyUSB.h>
Adafruit_USBD_WebUSB usb_web;
WEBUSB_URL_DEF(landingPage, 1, "speedence.com");

int wheel = 1;
int wheelPrevious = 0;
int wheelWait;

int pedal = 2;
int pedalPrevious = 0;
int pedalWait;

void setup() {
 
  pinMode(9, INPUT_PULLUP);
  usb_web.setLandingPage(&landingPage);
  usb_web.setLineStateCallback(line_state_callback);
  usb_web.begin();
  Serial.begin(115200);
  while(!USBDevice.mounted()) delay(1);
  randomSeed(analogRead(A0));
  wheelWait = random(200, 500);
  pedalWait = random(500, 800);
  attachInterrupt(digitalPinToInterrupt(10), sendWheel, LOW);
  attachInterrupt(digitalPinToInterrupt(11), sendPedal, LOW);
  attachInterrupt(digitalPinToInterrupt(12), sendWheel, LOW);
  attachInterrupt(digitalPinToInterrupt(13), sendPedal, LOW);
}

void loop() {
  int now = millis();
  if (!digitalRead(9)) {
     if (now - wheelPrevious > wheelWait) {
       wheelPrevious = now;
       wheelWait = random(200, 500);
       sendWheel();
     }
     if (now - pedalPrevious > pedalWait) {
       pedalPrevious = now;
       pedalWait = random(500, 800);
       sendPedal();
     }
  }
}

void sendWheel() { wheel += 2; relay(wheel); }
void sendPedal() { pedal += 2; relay(pedal); }
void relay(int message) { usb_web.print(message); Serial.print(message); }
void line_state_callback(bool connected) { if (connected) relay(0); }

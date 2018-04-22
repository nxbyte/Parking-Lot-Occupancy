/*
   Warren Seto
   Recieve mode only
   Non-abstracted
*/

#include <RHReliableDatagram.h>
#include <RH_RF95.h>
#include <SPI.h>

#define CLIENT_ADDRESS 1
#define SERVER_ADDRESS 2

// 8 and 3 for m0 specific
RH_RF95 driver(8, 3);

RHReliableDatagram manager(driver, SERVER_ADDRESS);

void setup()
{
  // Init LED
  pinMode(13, OUTPUT);

  // Init Console
  Serial.begin(9600);

  pinMode(4, OUTPUT);
  digitalWrite(4, HIGH);

  if (!manager.init()) {}
    if (!driver.setFrequency(915.0)) {
    Serial.println("setFrequency failed");
    while (1);
  }

  driver.setTxPower(23, false);
}

uint8_t buf[RH_RF95_MAX_MESSAGE_LEN];

void loop()
{
  digitalWrite(13, HIGH);

  if (manager.available())
  {
    uint8_t len = sizeof(buf);
    uint8_t from;

    if (manager.recvfromAck(buf, &len, &from))
    {
      Serial.print((char*)buf);
    }
  }
}

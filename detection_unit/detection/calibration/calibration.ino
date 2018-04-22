/* 
 * Project : Senior Project
 * Purpose : Gather calibration values for outdoor deployment and sensor verification
 */

#include <Wire.h>
#include <VL53L0X.h>

#define SONIC_PIN A5
#define SONIC_THRESHOLD 0x2e2f3031
#define SONIC_TIMER_PRESCALER 0x3
#define SONIC_PRECISION 200000

#define INFRARED_THRESHOLD 0xF0F0F0F0 // Detect 20 cm 
#define INFRARED_TIMER 50
#define INFRARED_AMOUNT_SENSE 20

VL53L0X infrared;

void setup()
{
  Serial.begin(9600);                                     // Enable Serial Debugging
  pinMode(SONIC_PIN, INPUT);                              // Enable Reading Ultrasound Pin
  
  Wire.begin();                                           // Initialize Infrared I2C
  infrared.init(false);                                   // Initialize Infrared Device
  infrared.setMeasurementTimingBudget(SONIC_PRECISION);   // Accurate measurement (200 ms)
  infrared.startContinuous(INFRARED_TIMER);
}

void loop()
{
  Serial.print(infrared.readRangeContinuousMillimeters() / 32);
  Serial.print("\t");
  Serial.println(analogRead(SONIC_PIN));
}

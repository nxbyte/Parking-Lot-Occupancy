// Senior Project

#include <Wire.h>
#include <VL53L0X.h>
#include <LoRaNetwork.h>

#define SONIC_PIN A5
#define SONIC_THRESHOLD 0x9798999A              // Detect Car: Sensor detects 150 or lower (Car should be detected as passed by)
#define SONIC_TIMER_PRESCALER 0x3

#define INFRARED_THRESHOLD 0x2e2f3031           // Detect Car: Sensor detects 32 or greater (Gate up should read a buffer of 255)
#define INFRARED_TIMER 200
#define INFRARED_AMOUNT_SENSE 15

#define BATTERY_TIMER_PRESCALER 0x5

uint8_t car_count;                              // Variable to keep car count

volatile uint64_t ultrasonic_buffer;            // Buffer to hold previous ultrasonic readings

uint64_t infrared_buffer;                       // Buffer to hold previous time of flight readings
uint8_t infrared_counter;                       // Predefined counter for time of flight sensor analysis
VL53L0X infrared;                               // Object that configures time of flight sensor

Network wireless;                               // LoRa Network Driver


/* Setup Procedure : Setup sensors, initialize variables, and configures timers */
void setup()
{
  wireless.init();                              // Initialize Wireless Network Driver
  Serial.begin(9600);                           // Enable Serial Debugging
  pinMode(SONIC_PIN, INPUT);                    // Enable Reading Ultrasound Pin
  
  car_count = 0;                                // Initialize Car Counter

  ultrasonic_buffer = 0xFFFFFFFF;               // Initialize Ultrasound Buffer
  infrared_buffer = 0x00000000;                 // Initialize Infrared Buffer
  
  Wire.begin();                                 // Initialize Infrared I2C
  infrared.init(false);                         // Initialize Infrared Device
  infrared.setMeasurementTimingBudget(200000);  // Accurate measurement (200 ms)

  noInterrupts();                               // Disable All Interrupts for setting up timers
  
  /* Timer 1 Setup: Ultrasonic */
  TCNT1 = 0;                                    // Set Initial value
  TIMSK1 = 0x01;                                // Enable/Disable Timer1
  TCCR1A = 0;                                   // Disable PWM output pin
  TCCR1B = SONIC_TIMER_PRESCALER;               // Set Timer1 prescaler to 64

  /* Timer 3 Setup: Battery Readings */
  TCNT3 = 0;                                    // Set Initial value
  TIMSK3 = 0x01;                                // Enable/Disable Timer3
  TCCR3A = 0;                                   // Disable PWM output pin
  TCCR3B = BATTERY_TIMER_PRESCALER;             // Set Timer3 prescaler to 1024

  interrupts();                                 // Enable All Interrupts after setting up timers
}

/* Timer1 : Ultrasound sensing every 500 ms */
ISR(TIMER1_OVF_vect)
{
  Serial.println("ULTRA");
  ultrasonic_buffer <<= 8;                                // Shift values in the buffer to make room for a new uint8_t value
  ultrasonic_buffer += min(analogRead(SONIC_PIN), 0xFF);  // Add new uint8_t value into the buffer
}

/* Timer3 : Battery Reading every 8.4 seconds */
ISR(TIMER3_OVF_vect)
{
  Serial.println("BATTERY");
  // TODO
}

void loop()
{
    /*
    // Debug Ultrasound
    Serial.print("Uls:   ");
    Serial.print((unsigned long)ultrasonic_buffer, HEX);
    Serial.print(" ?<=? ");
    Serial.println((unsigned long)SONIC_THRESHOLD, HEX);
    */

  // Check the ultrasonic buffer to see if its senses something moving within a threshold  
  if ((unsigned long)ultrasonic_buffer <= SONIC_THRESHOLD) 
  {
    infrared_counter = INFRARED_AMOUNT_SENSE;
    
    infrared.startContinuous(INFRARED_TIMER);
 
    while(infrared_counter--) 
    {
      infrared_buffer <<= 8;
      infrared_buffer += (uint8_t)(infrared.readRangeContinuousMillimeters() / 32);
    }

    infrared.stopContinuous();

    /*
    // Debug ToF
    Serial.print("ToF:   ");
    Serial.print((unsigned long)infrared_buffer, HEX);
    Serial.print(" ?>? ");
    Serial.println((unsigned long)INFRARED_THRESHOLD, HEX);
    */
      
    if ((unsigned long)infrared_buffer > INFRARED_THRESHOLD) 
    {
      car_count++;
    }

    // Resets both buffers to sense another new vehicle  
    ultrasonic_buffer = 0xFFFFFFFF;
    infrared_buffer = 0x00000000;
  }
  else if (car_count > 0) 
  {
    wireless.send_count(car_count);
    
    Serial.print("TRANSMIT");
    Serial.println(car_count);
    
    car_count = 0;
  }
}

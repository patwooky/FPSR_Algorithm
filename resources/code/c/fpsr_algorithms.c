// SPDX-License-Identifier: MIT — See LICENSE for full terms

/**
 * @file fpsr_algorithms.c
 * @brief Portable C implementation of FPS-R algorithms: Stacked Modulo (SM) and Quantised Switching (QS).
 * @details This file contains two stateless, frame-persistent randomization algorithms.
 * It uses a custom portable_rand() function to ensure deterministic and
 * consistent results across any platform.
 */

 #include <math.h> // For sin() and floor()
 #include <stdio.h> // For NULL
 
 /**
  * A simple, portable pseudo-random number generator.
  * @brief Generates a deterministic float between 0.0 and 1.0 from an integer seed.
  * @param seed An integer used to generate the random number.
  * @return A pseudo-random float between 0.0 and 1.0.
  */
 float portable_rand(int seed) {
     // A common technique for a simple hash-like random number.
     // The large prime numbers are used to create a chaotic, unpredictable result.
     // The frac() part (or fmod(x, 1.0)) ensures the result is in the [0, 1) range.
     float result = sin((float)seed * 12.9898) * 43758.5453;
     return result - floor(result);
 }
 
 
 /******************************************************************************/
 /* FPS-R: Stacked Modulo (SM)                            */
 /******************************************************************************/
 
 /**
  * @brief Generates a persistent random value that holds for a calculated duration.
  * @details This function uses a two-step process. First, it determines a random
  * "hold duration". Second, it generates a stable integer for that duration,
  * which is then used as a seed to produce the final, held random value.
  *
  * @param frame The current frame or time input.
  * @param minHold The minimum duration (in frames) for a value to hold.
  * @param maxHold The maximum duration (in frames) for a value to hold.
  * @param reseedInterval The fixed interval at which a new hold duration is calculated.
  * @param seedInner An offset for the random duration calculation to create unique sequences.
  * @param seedOuter An offset for the final value calculation to create unique sequences.
  * @return A float value between 0.0 and 1.0 that remains constant for the hold duration.
  */
 float fpsr_sm(
     int frame, int minHold, int maxHold,
     int reseedInterval, int seedInner, int seedOuter)
 {
     // --- 1. Calculate the random hold duration ---
     if (reseedInterval < 1) { reseedInterval = 1; } // Prevent division by zero.
 
     float rand_for_duration = portable_rand(seedInner + frame - (frame % reseedInterval));
     int holdDuration = (int)floor(minHold + rand_for_duration * (maxHold - minHold));
 
     if (holdDuration < 1) { holdDuration = 1; } // Prevent division by zero.
 
     // --- 2. Generate the stable integer "state" for the hold period ---
     // This value is constant for the entire duration of the hold.
     int held_integer_state = (seedOuter + frame) - ((seedOuter + frame) % holdDuration);
 
     // --- 3. Use the stable state as a seed for the final random value ---
     // Because the seed is stable, the final value is also stable.
     float fpsr_output = portable_rand(held_integer_state);
 
     return fpsr_output;
 }
 
// Sample code to call the FPS-R:SM function
// Parameters
int frame = 100; // Replace with the current frame value
int minHoldFrames = 16; // probable minimum held period
int maxHoldFrames = 24; // maximum held period before cycling
int reseedFrames = 9; // inner mod cycle timing
int offsetInner = -41; // offsets the inner frame
int offsetOuter = 23; // offsets the outer frame

// Call the FPS-R:SM function
float randVal = 
    fpsr_sm(
        int(frame), minHoldFrames, maxHoldFrames, 
        reseedFrames, offsetInner, offsetOuter);
float randVal_previous = 
    fpsr_sm(
        int(frame-1), minHoldFrames, maxHoldFrames, 
        reseedFrames, offsetInner, offsetOuter);
int changed = 0;
if (randVal != randVal_previous) {
    changed = 1; // value has changed from the previous frame
}


 /******************************************************************************/
 /* FPS-R: Quantised Switching (QS)                         */
 /******************************************************************************/
 
 /**
  * @brief Generates a flickering, quantised value by switching between two sine wave streams.
  * @details This function creates two separate, quantised sine waves and switches
  * between them at a fixed interval to create complex, glitch-like patterns.
  *
  * @param frame The current frame or time input.
  * @param baseWaveFreq The base frequency for the modulation wave of stream 1.
  * @param stream2FreqMult A multiplier for the second stream's frequency. If < 0, a default is used.
  * @param quantLevelsMinMax An array of two integers for the min and max quantisation levels.
  * @param streamsOffset An array of two integers to offset the frame for each stream.
  * @param streamSwitchDur The number of frames after which the streams switch. If < 1, a default is derived.
  * @param stream1QuantDur The duration for stream 1's quantisation switch. If < 1, a default is derived.
  * @param stream2QuantDur The duration for stream 2's quantisation switch. If < 1, a default is derived.
  * @return A float value between 0.0 and 1.0 that remains constant for the hold duration.
  */
 float fpsr_qs(
     int frame, float baseWaveFreq, float stream2FreqMult,
     const int quantLevelsMinMax[2], const int streamsOffset[2],
     int streamSwitchDur, int stream1QuantDur, int stream2QuantDur)
 {
     // --- 1. Set default durations if not provided ---
     // This pattern allows for optional parameters in a portable C-style.
     if (streamSwitchDur < 1) {
         streamSwitchDur = (int)floor((1.0 / baseWaveFreq) * 0.76);
     }
     if (stream1QuantDur < 1) {
         stream1QuantDur = (int)floor((1.0 / baseWaveFreq) * 1.2);
     }
     if (stream2QuantDur < 1) {
         stream2QuantDur = (int)floor((1.0 / baseWaveFreq) * 0.9);
     }
     // Ensure durations are at least 1 frame to prevent division by zero.
     if (streamSwitchDur < 1) { streamSwitchDur = 1; }
     if (stream1QuantDur < 1) { stream1QuantDur = 1; }
     if (stream2QuantDur < 1) { stream2QuantDur = 1; }
 
     // --- 2. Calculate quantisation levels for each stream ---
     // The quantisation level itself switches halfway through its own duration cycle.
     int s1_quant_level;
     if ((streamsOffset[0] + frame) % stream1QuantDur < stream1QuantDur / 2) {
         s1_quant_level = quantLevelsMinMax[0];
     } else {
         s1_quant_level = quantLevelsMinMax[1];
     }
 
     int s2_quant_level;
     // Magic numbers are used to create more variation in the second stream's character.
     const float STREAM2_QUANT_RATIO_MIN = 1.24;
     const float STREAM2_QUANT_RATIO_MAX = 0.66;
     if ((streamsOffset[1] + frame) % stream2QuantDur < stream2QuantDur / 2) {
         s2_quant_level = (int)floor(quantLevelsMinMax[0] * STREAM2_QUANT_RATIO_MIN);
     } else {
         s2_quant_level = (int)floor(quantLevelsMinMax[1] * STREAM2_QUANT_RATIO_MAX);
     }
     // Ensure quantisation levels are at least 1.
     if (s1_quant_level < 1) { s1_quant_level = 1; }
     if (s2_quant_level < 1) { s2_quant_level = 1; }
 
 
     // --- 3. Generate the two quantised sine wave streams ---
     if (stream2FreqMult < 0) { stream2FreqMult = 3.7; } // Default multiplier.
 
     float stream1 = floor(sin((float)(streamsOffset[0] + frame) * baseWaveFreq) * s1_quant_level) / s1_quant_level;
     float stream2 = floor(sin((float)(streamsOffset[1] + frame) * baseWaveFreq * stream2FreqMult) * s2_quant_level) / s2_quant_level;
 
     // --- 4. Switch between the two streams ---
     float active_stream_val;
     if ((frame % streamSwitchDur) < streamSwitchDur / 2) {
         active_stream_val = stream1;
     } else {
         active_stream_val = stream2;
     }
 
     // --- 5. Hash the final output to create a random-looking value ---
     // The stepped sine wave output is converted to a large integer and used
     // as a seed to produce the final, held random value.
     fpsr_output = portable_rand((int)(active_stream_val * 100000.0));
     return fpsr_output;
 }
 
// Sample code to call the FPS-R:QS function
// Parameters
int frame = 103; // Current frame number
float baseWaveFreq = 0.012; // Base frequency for the modulation wave of stream 1
float stream2freqMult = 3.1; // Multiplier for the second stream's frequency
int quantLevelsMinMax[2] = {12, 22}; // Min, Max quantisation levels for the two streams
int streamsOffset[2] = {0, 76}; // Offset for the two streams
int streamSwitchDur = 24; // Duration for switching streams in frames
int stream1QuantDur = 16; // Duration for the first stream's quantisation switch cycle in frames
int stream2QuantDur = 20; // Duration for the second stream's quantisation switch cycle in frames

float randVal = fpsr_qs(
    frame, baseWaveFreq, stream2freqMult, quantLevelsMinMax, 
    streamsOffset, streamSwitchDur, stream1QuantDur, stream2QuantDur);

// another call to fpsr_qs for the previous frame
float randVal_previous = fpsr_qs(
    int(@Frame - 1), baseWaveFreq, stream2freqMult, quantLevelsMinMax, 
    streamsOffset, streamSwitchDur, stream1QuantDur, stream2QuantDur);

int changed = 0; // Variable to track if the value has changed
if (randVal != randVal_previous) {
    changed = 1; // Mark as changed if the value has changed from the previous frame
} 
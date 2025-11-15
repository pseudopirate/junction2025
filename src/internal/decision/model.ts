export const model = {
    "feature": "sleep_hours",
    "threshold": 7.198521375656128,
    "left": {
      "feature": "prodrome_symptoms",
      "threshold": 0.5,
      "left": {
        "feature": "screen_time_hours",
        "threshold": 6.668567180633545,
        "left": {
          "feature": "sleep_hours",
          "threshold": 6.96010160446167,
          "left": {
            "feature": "attacks_last_30_days",
            "threshold": 9.5,
            "left": {
              "value": [
                0.9375,
                0.0625
              ]
            },
            "right": {
              "value": [
                0.68,
                0.32
              ]
            }
          },
          "right": {
            "feature": "screen_time_hours",
            "threshold": 4.574069499969482,
            "left": {
              "value": [
                0.0,
                1.0
              ]
            },
            "right": {
              "value": [
                0.6666666666666666,
                0.3333333333333333
              ]
            }
          }
        },
        "right": {
          "feature": "sleep_hours",
          "threshold": 5.0495030879974365,
          "left": {
            "value": [
              0.6666666666666666,
              0.3333333333333333
            ]
          },
          "right": {
            "feature": "stress_level",
            "threshold": 0.5,
            "left": {
              "value": [
                0.3333333333333333,
                0.6666666666666666
              ]
            },
            "right": {
              "value": [
                0.0,
                1.0
              ]
            }
          }
        }
      },
      "right": {
        "value": [
          0.0,
          1.0
        ]
      }
    },
    "right": {
      "feature": "sleep_hours",
      "threshold": 9.695796966552734,
      "left": {
        "feature": "days_since_last_attack",
        "threshold": 9.5,
        "left": {
          "feature": "attacks_last_7_days",
          "threshold": 5.5,
          "left": {
            "feature": "hydration_low",
            "threshold": 0.5,
            "left": {
              "value": [
                1.0,
                0.0
              ]
            },
            "right": {
              "value": [
                0.8571428571428571,
                0.14285714285714285
              ]
            }
          },
          "right": {
            "value": [
              0.3333333333333333,
              0.6666666666666666
            ]
          }
        },
        "right": {
          "value": [
            0.3333333333333333,
            0.6666666666666666
          ]
        }
      },
      "right": {
        "value": [
          0.25,
          0.75
        ]
      }
    }
  };
  
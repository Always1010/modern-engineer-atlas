#include "metric.h"
int clamp_percent(int value) noexcept {
    return value < 0 ? 0 : (value > 100 ? 100 : value);
}

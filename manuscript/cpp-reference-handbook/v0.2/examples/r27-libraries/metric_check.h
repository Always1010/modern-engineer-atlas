#ifndef HANDBOOK_METRIC_CHECK_H
#define HANDBOOK_METRIC_CHECK_H
#include "metric_api.h"
#include <iostream>

inline bool check_metric(const metric_api& api) {
    metric_context* context = api.open();
    if (!context) { std::cerr << "OPEN failed\n"; return false; }
    int32_t output = 77;
    bool ok = api.clamp_percent(nullptr, 1, &output) == -1 && output == 77;
    ok = (api.clamp_percent(context, 1, nullptr) == -1) && ok;
    const int32_t inputs[]{-1, 42, 101};
    const int32_t expected[]{0, 42, 100};
    for (int i = 0; i < 3; ++i) {
        ok = (api.clamp_percent(context, inputs[i], &output) == 0 &&
              output == expected[i]) && ok;
    }
    api.close(context); // Library-owned allocation is destroyed by that library.
    std::cout << "CLOSED metric context\n";
    return ok;
}
#endif

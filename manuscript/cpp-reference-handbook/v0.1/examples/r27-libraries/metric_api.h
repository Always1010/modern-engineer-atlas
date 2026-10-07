#ifndef HANDBOOK_METRIC_API_H
#define HANDBOOK_METRIC_API_H
#include <stdint.h>

#if defined(_WIN32)
#define METRIC_CALL __cdecl
#if defined(METRIC_STATIC) || defined(METRIC_EXPLICIT)
#define METRIC_API
#elif defined(METRIC_BUILD)
#define METRIC_API __declspec(dllexport)
#else
#define METRIC_API __declspec(dllimport)
#endif
#else
#define METRIC_CALL
#define METRIC_API __attribute__((visibility("default")))
#endif

#ifdef __cplusplus
#define METRIC_NOEXCEPT noexcept
extern "C" {
#else
#define METRIC_NOEXCEPT
#endif

typedef struct metric_context metric_context;
typedef struct metric_api {
    uint32_t size;
    uint32_t version;
    metric_context* (METRIC_CALL *open)(void);
    int32_t (METRIC_CALL *clamp_percent)(metric_context*, int32_t, int32_t*);
    void (METRIC_CALL *close)(metric_context*);
} metric_api;

METRIC_API metric_context* METRIC_CALL metric_open(void) METRIC_NOEXCEPT;
METRIC_API int32_t METRIC_CALL metric_clamp_percent(
    metric_context*, int32_t value, int32_t* output) METRIC_NOEXCEPT;
METRIC_API void METRIC_CALL metric_close(metric_context*) METRIC_NOEXCEPT;
METRIC_API const metric_api* METRIC_CALL metric_get_api(uint32_t version) METRIC_NOEXCEPT;

#ifdef __cplusplus
}
#endif
#endif

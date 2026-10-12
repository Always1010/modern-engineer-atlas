#include "metric_check.h"
#include <cstring>
#include <filesystem>
#include <string>
#include <system_error>
#ifdef _WIN32
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <shellapi.h>
#include <cwchar>
#else
#include <dlfcn.h>
#endif

class library {
#ifdef _WIN32
    HMODULE handle_ = nullptr;
#else
    void* handle_ = nullptr;
#endif
public:
    library() = default;
    library(const library&) = delete;
    library& operator=(const library&) = delete;
    ~library() { if (handle_) close(); }
    bool open(const std::filesystem::path& path) {
#ifdef _WIN32
        // Absolute UTF-16 path; dependencies search the DLL directory and System32.
        handle_ = LoadLibraryExW(path.c_str(), nullptr,
                                LOAD_LIBRARY_SEARCH_DLL_LOAD_DIR |
                                LOAD_LIBRARY_SEARCH_SYSTEM32);
        if (!handle_) {
            const DWORD code = GetLastError();
            std::cerr << "LOAD error " << code << '\n';
        }
#else
        handle_ = dlopen(path.c_str(), RTLD_NOW | RTLD_LOCAL);
        if (!handle_) std::cerr << "LOAD error " << dlerror() << '\n';
#endif
        return handle_ != nullptr;
    }
    using get_api_fn = const metric_api* (METRIC_CALL *)(uint32_t);
    get_api_fn entry(const char* name) {
#ifdef _WIN32
        auto address = GetProcAddress(handle_, name);
        if (!address) {
            const DWORD code = GetLastError();
            std::cerr << "ENTRY error " << code << '\n'; return nullptr;
        }
        return reinterpret_cast<get_api_fn>(address);
#else
        dlerror();
        void* address = dlsym(handle_, name);
        const char* error = dlerror();
        if (error) { std::cerr << "ENTRY error " << error << '\n'; return nullptr; }
        // POSIX supports this conversion; ISO C++ alone does not guarantee it.
        return reinterpret_cast<get_api_fn>(address);
#endif
    }
    bool close() {
        if (!handle_) return true;
#ifdef _WIN32
        if (!FreeLibrary(handle_)) {
            const DWORD code = GetLastError();
            std::cerr << "UNLOAD error " << code << '\n'; return false;
        }
#else
        if (dlclose(handle_) != 0) {
            std::cerr << "UNLOAD error " << dlerror() << '\n'; return false;
        }
#endif
        handle_ = nullptr;
        std::cout << "RELEASED library handle\n";
        return true;
    }
};

int run(const std::filesystem::path& supplied, bool missing_entry, bool bad_version) {
    std::error_code error;
    auto path = std::filesystem::absolute(supplied, error);
    if (error) { std::cerr << "PATH error " << error.message() << '\n'; return 2; }
    library module;
    if (!module.open(path)) return 3;
    auto get_api = module.entry(missing_entry ? "metric_no_such_entry" : "metric_get_api");
    if (!get_api) return 4; // module destructor releases the handle.
    const metric_api* api = get_api(bad_version ? 2 : 1);
    if (!api || api->size != sizeof(metric_api) || api->version != 1 ||
        !api->open || !api->clamp_percent || !api->close) {
        std::cerr << "ABI version or table rejected\n"; return 5;
    }
    const bool ok = check_metric(*api); // All business state is closed before unload.
    api = nullptr;
    get_api = nullptr;
    if (!module.close()) return 6;
    if (!ok) return 7;
    std::cout << "PASS plugin metric: 0 42 100\n";
    return std::cout ? 0 : 8;
}

int main(int argc, char** argv) {
    try {
#ifdef _WIN32
        (void)argc; (void)argv;
        int count = 0;
        wchar_t** wide = CommandLineToArgvW(GetCommandLineW(), &count);
        if (!wide) {
            const DWORD code = GetLastError();
            std::cerr << "ARGS error " << code << '\n'; return 2;
        }
        struct argv_owner { wchar_t** data; ~argv_owner() { LocalFree(data); } } owner{wide};
        const bool missing = count == 3 && std::wcscmp(wide[2], L"--missing-entry") == 0;
        const bool version = count == 3 && std::wcscmp(wide[2], L"--bad-version") == 0;
        if (count < 2 || count > 3 || (count == 3 && !missing && !version)) {
            std::cerr << "usage: plugin_host PATH [--missing-entry|--bad-version]\n"; return 2;
        }
        return run(std::filesystem::path(wide[1]), missing, version);
#else
        const bool missing = argc == 3 && std::strcmp(argv[2], "--missing-entry") == 0;
        const bool version = argc == 3 && std::strcmp(argv[2], "--bad-version") == 0;
        if (argc < 2 || argc > 3 || (argc == 3 && !missing && !version)) {
            std::cerr << "usage: plugin_host PATH [--missing-entry|--bad-version]\n"; return 2;
        }
        return run(std::filesystem::path(argv[1]), missing, version);
#endif
    } catch (const std::exception& error) {
        std::cerr << "HOST error " << error.what() << '\n'; return 9;
    }
}

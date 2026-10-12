#include <chrono>
#include <filesystem>
#include <iostream>
#include <sstream>
#include <string>
#include <system_error>

int main() {
    using namespace std::chrono;
    const steady_clock::time_point start{};
    const auto deadline = start + milliseconds(100);
    const auto retry_now = start + milliseconds(70);
    if (duration_cast<milliseconds>(deadline - retry_now).count() != 30) return 1;
    std::istringstream input("10 20 bad");
    int value = 0, sum = 0;
    while (input >> value) sum += value;
    if (sum != 30 || !input.fail() || input.eof()) return 2;
    input.clear();
    std::string token;
    input >> token;
    if (token != "bad") return 3;
    std::filesystem::path p = std::filesystem::path("logs") / "run.txt";
    if (p.filename() != "run.txt") return 4;
    std::error_code ec;
    (void)std::filesystem::status(p, ec);
    // The path may or may not exist; no write is performed.
    std::cout << "remaining=30ms sum=30 invalid=bad file=run.txt\n";
}

cmake_minimum_required(VERSION 3.16)
project(r30 LANGUAGES CXX)
add_library(metric STATIC metric.cpp)
target_include_directories(metric PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}>
    $<INSTALL_INTERFACE:include>)
target_compile_features(metric PUBLIC cxx_std_17)
add_executable(app main.cpp)
target_link_libraries(app PRIVATE metric)
set_target_properties(metric app PROPERTIES CXX_EXTENSIONS OFF)
enable_testing()
add_test(NAME r30_smoke COMMAND app)
install(TARGETS metric EXPORT MetricTargets ARCHIVE DESTINATION lib)
install(TARGETS app RUNTIME DESTINATION bin)
install(FILES metric.h DESTINATION include)
install(EXPORT MetricTargets NAMESPACE Handbook::
    DESTINATION lib/cmake/Metric)

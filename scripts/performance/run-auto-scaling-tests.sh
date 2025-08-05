#!/bin/bash

# Auto-Scaling Test Runner
# This script runs a series of auto-scaling tests with different load patterns
# and generates reports for each test.
#
# Implements RF040 - Test scaling under load
#
# Usage:
#   ./run-auto-scaling-tests.sh [target-url] [duration]

set -e

# Default values
TARGET_URL=${1:-"http://localhost:5000"}
DURATION=${2:-300} # 5 minutes default
REPORTS_DIR="./reports/auto-scaling"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== AeroSuite Auto-Scaling Test Runner =====${NC}"
echo -e "${BLUE}Target URL: ${TARGET_URL}${NC}"
echo -e "${BLUE}Test Duration: ${DURATION} seconds${NC}"
echo -e "${BLUE}=============================================${NC}\n"

# Create reports directory if it doesn't exist
mkdir -p "${REPORTS_DIR}"

# Load patterns to test
PATTERNS=("gradual" "step" "spike" "wave" "sustained")

# Run tests for each pattern
for PATTERN in "${PATTERNS[@]}"; do
    echo -e "${YELLOW}Starting test with pattern: ${PATTERN}${NC}"
    
    # Define report file paths
    JSON_REPORT="${REPORTS_DIR}/auto-scaling-test-${PATTERN}-${TIMESTAMP}.json"
    HTML_REPORT="${REPORTS_DIR}/auto-scaling-test-${PATTERN}-${TIMESTAMP}.html"
    
    echo -e "${GREEN}Running test...${NC}"
    node ./scripts/performance/auto-scaling-test.js \
        --pattern="${PATTERN}" \
        --duration="${DURATION}" \
        --target="${TARGET_URL}" \
        --report-file="${JSON_REPORT}" \
        --monitor-interval=5
    
    # Check if test was successful
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Test completed successfully.${NC}"
        echo -e "${GREEN}JSON report saved to: ${JSON_REPORT}${NC}"
        
        echo -e "${GREEN}Generating HTML report...${NC}"
        node ./scripts/performance/auto-scaling-visualizer.js \
            --file="${JSON_REPORT}" \
            --output="${HTML_REPORT}" \
            --title="Auto-Scaling Test Results - ${PATTERN} pattern"
        
        echo -e "${GREEN}HTML report saved to: ${HTML_REPORT}${NC}"
    else
        echo -e "${RED}Test failed.${NC}"
    fi
    
    echo -e "${YELLOW}Waiting 30 seconds before next test...${NC}"
    sleep 30
done

echo -e "${BLUE}===== All tests completed =====${NC}"
echo -e "${BLUE}Reports saved to: ${REPORTS_DIR}${NC}"

# Create combined report
echo -e "${YELLOW}Creating combined report...${NC}"
COMBINED_HTML="${REPORTS_DIR}/auto-scaling-tests-combined-${TIMESTAMP}.html"

cat > "${COMBINED_HTML}" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auto-Scaling Tests - Combined Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    h1, h2 {
      color: #2c3e50;
    }
    .test-links {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .test-card {
      background-color: #f8f9fa;
      border-radius: 6px;
      padding: 15px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      text-align: center;
    }
    .test-card a {
      color: #007bff;
      text-decoration: none;
      font-weight: 500;
    }
    .test-card a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Auto-Scaling Tests - Combined Report</h1>
    <p>Tests conducted on $(date) against ${TARGET_URL}</p>
    
    <h2>Test Reports</h2>
    <div class="test-links">
EOF

# Add links to individual reports
for PATTERN in "${PATTERNS[@]}"; do
    HTML_REPORT="auto-scaling-test-${PATTERN}-${TIMESTAMP}.html"
    REPORT_NAME="$(echo ${PATTERN} | tr '[:lower:]' '[:upper:]') Pattern"
    
    echo "      <div class=\"test-card\">" >> "${COMBINED_HTML}"
    echo "        <a href=\"${HTML_REPORT}\">${REPORT_NAME}</a>" >> "${COMBINED_HTML}"
    echo "      </div>" >> "${COMBINED_HTML}"
done

cat >> "${COMBINED_HTML}" << EOF
    </div>
    
    <h2>Test Summary</h2>
    <p>The following tests were conducted to evaluate the auto-scaling capabilities of AeroSuite:</p>
    <ul>
      <li><strong>Gradual Pattern:</strong> Gradually increasing load to test smooth scaling</li>
      <li><strong>Step Pattern:</strong> Step-wise increasing load to test scaling at specific thresholds</li>
      <li><strong>Spike Pattern:</strong> Sudden spike in load to test rapid scaling</li>
      <li><strong>Wave Pattern:</strong> Oscillating load to test scaling up and down</li>
      <li><strong>Sustained Pattern:</strong> Sustained high load to test stability at maximum scale</li>
    </ul>
    
    <h2>Conclusion</h2>
    <p>
      These tests verify the implementation of RF039 (Configure auto-scaling for all services)
      by demonstrating the system's ability to automatically adjust capacity based on demand.
      Please refer to the individual test reports for detailed metrics and scaling behavior.
    </p>
  </div>
</body>
</html>
EOF

echo -e "${GREEN}Combined report saved to: ${COMBINED_HTML}${NC}"
echo -e "${BLUE}===== Test suite completed =====${NC}" 
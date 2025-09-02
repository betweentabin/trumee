#\!/usr/bin/env python3
"""
Seeker (User) page button functionality test script
Tests all navigation and interaction buttons for job seekers
"""

import time
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import json

# Configuration
BASE_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8000"
TEST_EMAIL = "testseeker@example.com"
TEST_PASSWORD = "password123"

# Test results
test_results = {
    "passed": [],
    "failed": [],
    "errors": []
}

def login_seeker(driver):
    """Login as a seeker/user"""
    try:
        # Navigate to seeker login page
        driver.get(f"{BASE_URL}/auth/login")
        time.sleep(2)
        
        # Fill in login form
        email_input = driver.find_element(By.NAME, "email")
        password_input = driver.find_element(By.NAME, "password")
        
        email_input.send_keys(TEST_EMAIL)
        password_input.send_keys(TEST_PASSWORD)
        
        # Submit form
        submit_button = driver.find_element(By.XPATH, "//button[contains(text(), 'ログイン')]")
        submit_button.click()
        
        # Wait for redirect
        time.sleep(3)
        
        # Check if redirected to appropriate page
        current_url = driver.current_url
        if "/users" in current_url or "/seeker" in current_url or "/dashboard" in current_url:
            print(f"✅ Login successful - redirected to {current_url}")
            test_results["passed"].append(f"Login and redirect: {current_url}")
            return True
        else:
            print(f"❌ Login failed - unexpected URL: {current_url}")
            test_results["failed"].append(f"Login redirect: {current_url}")
            return False
            
    except Exception as e:
        print(f"❌ Login failed: {str(e)}")
        test_results["failed"].append(f"Login: {str(e)}")
        return False

def test_users_page_navigation(driver):
    """Test /users page navigation"""
    print("\n--- Testing /users Page Navigation ---")
    
    try:
        # Navigate to /users page
        driver.get(f"{BASE_URL}/users")
        time.sleep(2)
        
        # Check if page loaded
        if "/users" in driver.current_url:
            print("✅ /users page loaded successfully")
            test_results["passed"].append("/users page load")
        else:
            print(f"❌ Failed to load /users page - URL: {driver.current_url}")
            test_results["failed"].append("/users page load")
            
    except Exception as e:
        print(f"❌ /users page error: {str(e)}")
        test_results["errors"].append(f"/users page: {str(e)}")

def test_header_buttons(driver):
    """Test header navigation buttons for seekers"""
    print("\n--- Testing Seeker Header Buttons ---")
    
    # Test マイページ button
    try:
        mypage_button = driver.find_element(By.XPATH, "//button[contains(text(), 'マイページ')]")
        mypage_button.click()
        time.sleep(1)
        
        # Check if action performed (may not navigate if disabled)
        print("✅ 'マイページ' button clicked")
        test_results["passed"].append("Header: マイページ button")
    except Exception as e:
        print(f"❌ 'マイページ' button error: {str(e)}")
        test_results["errors"].append(f"Header マイページ: {str(e)}")
    
    # Test ログアウト button
    try:
        logout_button = driver.find_element(By.XPATH, "//button[contains(text(), 'ログアウト')]")
        # Don't actually click to avoid logging out during test
        if logout_button.is_displayed():
            print("✅ 'ログアウト' button present")
            test_results["passed"].append("Header: ログアウト button present")
        else:
            print("❌ 'ログアウト' button not visible")
            test_results["failed"].append("Header: ログアウト button visibility")
    except Exception as e:
        print(f"❌ 'ログアウト' button error: {str(e)}")
        test_results["errors"].append(f"Header ログアウト: {str(e)}")

def test_sidebar_navigation(driver):
    """Test sidebar navigation links for seekers"""
    print("\n--- Testing Seeker Sidebar Navigation ---")
    
    sidebar_links = [
        ("TOP", "/users"),
        ("登録情報の確認・変更", "/users/myinfo/registerdata"),
        ("パスワードの変更", "/users/myinfo/password"),
        ("支払い情報登録・変更", "/users/myinfo/payment"),
        ("有料プラン", "/users/myinfo/paidplans")
    ]
    
    for link_text, expected_url in sidebar_links:
        try:
            # Navigate to /users first
            driver.get(f"{BASE_URL}/users")
            time.sleep(1)
            
            # Find and click the link
            link = driver.find_element(By.XPATH, f"//span[contains(text(), '{link_text}')]")
            link.click()
            time.sleep(1)
            
            if expected_url in driver.current_url:
                print(f"✅ '{link_text}' link works - navigated to {expected_url}")
                test_results["passed"].append(f"Sidebar: {link_text}")
            else:
                print(f"❌ '{link_text}' link failed - Expected: {expected_url}, Got: {driver.current_url}")
                test_results["failed"].append(f"Sidebar: {link_text}")
                
        except Exception as e:
            print(f"❌ '{link_text}' link error: {str(e)}")
            test_results["errors"].append(f"Sidebar {link_text}: {str(e)}")

def test_seeker_dashboard(driver):
    """Test seeker dashboard page"""
    print("\n--- Testing Seeker Dashboard ---")
    
    try:
        # Navigate to seeker dashboard
        driver.get(f"{BASE_URL}/seeker/dashboard")
        time.sleep(2)
        
        # Check if dashboard loaded
        if "/seeker/dashboard" in driver.current_url or "/dashboard" in driver.current_url:
            print("✅ Seeker dashboard loaded successfully")
            test_results["passed"].append("Seeker dashboard load")
            
            # Test Quick Links on dashboard
            quick_links = [
                ("履歴書管理", "/resumes"),
                ("応募管理", "/applications"),
                ("スカウト", "/scouts"),
                ("メッセージ", "/messages")
            ]
            
            for link_text, expected_url in quick_links:
                try:
                    # Find the link by text
                    link = driver.find_element(By.XPATH, f"//h3[contains(text(), '{link_text}')]")
                    parent_link = link.find_element(By.XPATH, "./ancestor::a")
                    href = parent_link.get_attribute("href")
                    
                    if expected_url in href:
                        print(f"✅ Quick link '{link_text}' points to {expected_url}")
                        test_results["passed"].append(f"Dashboard quick link: {link_text}")
                    else:
                        print(f"❌ Quick link '{link_text}' has wrong href: {href}")
                        test_results["failed"].append(f"Dashboard quick link: {link_text}")
                except:
                    print(f"⚠️ Quick link '{link_text}' not found")
                    test_results["errors"].append(f"Dashboard quick link: {link_text}")
                    
        else:
            print(f"❌ Failed to load seeker dashboard - URL: {driver.current_url}")
            test_results["failed"].append("Seeker dashboard load")
            
    except Exception as e:
        print(f"❌ Seeker dashboard error: {str(e)}")
        test_results["errors"].append(f"Seeker dashboard: {str(e)}")

def test_resume_pages(driver):
    """Test resume-related pages"""
    print("\n--- Testing Resume Pages ---")
    
    resume_pages = [
        ("/resumes", "履歴書一覧"),
        ("/resumes/new", "新規履歴書作成"),
        ("/career", "キャリア"),
        ("/career/create", "職務経歴書作成")
    ]
    
    for url, page_name in resume_pages:
        try:
            driver.get(f"{BASE_URL}{url}")
            time.sleep(2)
            
            if url in driver.current_url:
                print(f"✅ {page_name} page loaded - {url}")
                test_results["passed"].append(f"Resume page: {page_name}")
            else:
                print(f"❌ {page_name} page failed - Expected: {url}, Got: {driver.current_url}")
                test_results["failed"].append(f"Resume page: {page_name}")
                
        except Exception as e:
            print(f"❌ {page_name} page error: {str(e)}")
            test_results["errors"].append(f"Resume page {page_name}: {str(e)}")

def test_scout_application_pages(driver):
    """Test scout and application pages"""
    print("\n--- Testing Scout & Application Pages ---")
    
    pages = [
        ("/scouts", "スカウト一覧"),
        ("/applications", "応募一覧"),
        ("/interview-advice/applying-reasons", "応募理由アドバイス"),
        ("/interview-advice/prepare-interview", "面接準備")
    ]
    
    for url, page_name in pages:
        try:
            driver.get(f"{BASE_URL}{url}")
            time.sleep(2)
            
            if url in driver.current_url:
                print(f"✅ {page_name} page loaded - {url}")
                test_results["passed"].append(f"Scout/Application page: {page_name}")
            else:
                print(f"❌ {page_name} page failed - Expected: {url}, Got: {driver.current_url}")
                test_results["failed"].append(f"Scout/Application page: {page_name}")
                
        except Exception as e:
            print(f"❌ {page_name} page error: {str(e)}")
            test_results["errors"].append(f"Scout/Application page {page_name}: {str(e)}")

def test_api_toggle(driver):
    """Test API v1/v2 toggle on dashboard"""
    print("\n--- Testing API Version Toggle ---")
    
    try:
        # Navigate to seeker dashboard
        driver.get(f"{BASE_URL}/seeker/dashboard")
        time.sleep(2)
        
        # Find API toggle button
        toggle_button = driver.find_element(By.XPATH, "//button[contains(@class, 'rounded-full') and contains(@class, 'inline-flex')]")
        
        # Get initial state
        initial_classes = toggle_button.get_attribute("class")
        is_v2 = "bg-blue-600" in initial_classes
        
        print(f"Initial API version: {'v2' if is_v2 else 'v1'}")
        
        # Click toggle
        toggle_button.click()
        time.sleep(1)
        
        # Check new state
        new_classes = toggle_button.get_attribute("class")
        is_v2_after = "bg-blue-600" in new_classes
        
        if is_v2 \!= is_v2_after:
            print(f"✅ API toggle works - switched to {'v2' if is_v2_after else 'v1'}")
            test_results["passed"].append("API version toggle")
        else:
            print("❌ API toggle did not change state")
            test_results["failed"].append("API version toggle")
            
    except Exception as e:
        print(f"❌ API toggle error: {str(e)}")
        test_results["errors"].append(f"API toggle: {str(e)}")

def print_summary():
    """Print test summary"""
    print("\n" + "="*50)
    print("SEEKER PAGE TEST SUMMARY")
    print("="*50)
    
    total_tests = len(test_results["passed"]) + len(test_results["failed"]) + len(test_results["errors"])
    
    print(f"\n✅ Passed: {len(test_results['passed'])}/{total_tests}")
    for test in test_results["passed"]:
        print(f"   - {test}")
    
    if test_results["failed"]:
        print(f"\n❌ Failed: {len(test_results['failed'])}/{total_tests}")
        for test in test_results["failed"]:
            print(f"   - {test}")
    
    if test_results["errors"]:
        print(f"\n⚠️ Errors: {len(test_results['errors'])}/{total_tests}")
        for test in test_results["errors"]:
            print(f"   - {test}")
    
    print("\n" + "="*50)
    
    # Save results to file
    with open("seeker_button_test_results.json", "w", encoding="utf-8") as f:
        json.dump(test_results, f, ensure_ascii=False, indent=2)
    print("Results saved to seeker_button_test_results.json")

def main():
    # Setup Chrome driver
    options = webdriver.ChromeOptions()
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    # Comment out headless for debugging
    # options.add_argument('--headless')
    
    driver = webdriver.Chrome(options=options)
    driver.set_window_size(1280, 800)
    
    try:
        print("Starting Seeker Page Button Tests...")
        print("="*50)
        
        # Login as seeker
        if login_seeker(driver):
            # Run all tests
            test_users_page_navigation(driver)
            test_header_buttons(driver)
            test_sidebar_navigation(driver)
            test_seeker_dashboard(driver)
            test_resume_pages(driver)
            test_scout_application_pages(driver)
            test_api_toggle(driver)
        
        # Print summary
        print_summary()
        
    except Exception as e:
        print(f"\n⚠️ Test suite error: {str(e)}")
        test_results["errors"].append(f"Test suite: {str(e)}")
    finally:
        # Close browser
        driver.quit()
        print("\nTest completed.")

if __name__ == "__main__":
    main()
EOF < /dev/null
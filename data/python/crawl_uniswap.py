from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By

from webdriver_manager.chrome import ChromeDriverManager

import pandas as pd

CHROME_PATH = '/usr/bin/google-chrome'
CHROMEDRIVER_PATH = '/usr/bin/chromedriver'
WINDOW_SIZE = "1920,1080"

chrome_options = Options()
chrome_options.add_argument("--headless")
chrome_options.add_argument("--window-size=%s" % WINDOW_SIZE)
chrome_options.binary_location = CHROME_PATH

service = Service(CHROMEDRIVER_PATH)
# setup driver 
driver = webdriver.Chrome(service=service,
                              options=chrome_options)

driver.maximize_window() # For maximizing window
driver.implicitly_wait(20) # gives an implicit wait for 20 seconds

UNI_POOL_WEB_URL = "https://info.uniswap.org/#/pools"
TABLE_XPATH = '/html/body/div/div/div[2]/div[3]/div/div[4]/div'


driver.get(UNI_POOL_WEB_URL)
table = driver.find_element("xpath", TABLE_XPATH)

rows = table.find_element(By.CLASS_NAME, 'sc-fYiAbW dSQPJH')

print(rows)



driver.close()


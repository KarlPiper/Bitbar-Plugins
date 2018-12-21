#!/bin/bash

# <bitbar.title>View Settings</bitbar.title>
# <bitbar.version>v1.0</bitbar.version>
# <bitbar.author>Karl Piper</bitbar.author>
# <bitbar.author.github>KarlPiper</bitbar.author.github>
# <bitbar.desc>How to show variable settings for your BitBar plugin.</bitbar.desc>
# <bitbar.image>https://raw.githubusercontent.com/KarlPiper/Plugins-for-Bitbar/master/images/settings-preview.png</bitbar.image>
# <bitbar.dependencies>bash</bitbar.dependencies>

# OPTIONS
variable1=8
variable2=false
variable3="red"

# MENU BAR ICON
# black and transparent PNG 36x36px 144ppi
echo "| templateImage=iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAQAAABLCVATAAAACXBIWXMAABYlAAAWJQFJUiTwAAAA60lEQVR42t3WURGEIBAG4D8CEYxABCIYgQhG2AYXgQhGIIIRjEAEnVE8Tw7PZeXh7tgXZxw/YYVdgV8eCi1oCSNHGjhML/GQMRbhwDgpM9VgdB0G8HWYdD7v34uZ9u4Cclk8M9xHaL1L5Rk6QttLWFCfQB1MjH2uLIgSKBctBzIMSHGO6XDJuDpMQFODmWC/iPHQMmaAAaGHh0N3jZwzqrQu32YUCGM2G4XMWXoLF+Wfj4U7jI671CQ1qDjFlJSDIGM2aC8HA/dU5zuXP5SOUdbVQ6QsKF6TrO3Yuzs539+9nFkXaJefFo2/GDMGhVfeGhOX8QAAAABJRU5ErkJggg==";
echo "---"

function viewSettings () {
osascript <<EOD
	display alert "Settings Tutorial Settings" message "Variable1: " & "$variable1" & "\nVariable2: " & "$variable2" & "\nVariable3: " & "$variable3" & "\n\nTo change:\n1. Plugin Icon > Preferences > Open Plugins Folder\n2. Open 'settings.sh' in a text editor\n3. Modify variables at top of file"
EOD
}

# MENU ITEM HANDLERS
if [[ "$1" = "settings" ]]; then
		viewSettings;
fi

# MENU ITEMS
echo "Settings… | bash='$0' param1=settings terminal=false";
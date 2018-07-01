# d3ReusableCharts
*Reusable D3 Charts for ActigraVis Dashboard*

__Features:__
* _Legend Filtering_ - legends in chart toggle the series data plotted on all charts
* _Chart Resize_ - on window resize, the charts reload as per new container window size
* _Tooltip_ - more details are provided on hover over of tooltip
* _Scatterplot RectanglesOnHover_ - min-max and quartile rectangle on hover

__Data Format:__
These d3 charts are designed for Actigravis. Taking in to consideration the features like Legend data filtering, the charts in this project take the following data format - which is a nested json array:
`[{
	"key":"sleep",
	"color":"#3182bd",
	"values":[{"x":0,"y":54,"label":"LC_144"},{...},{...}],
	"group":true
}]`



Requirements:
* d3 v4
* jquery 3.3.1
* http server
* browser

Libraries such as d3 and jQuery are included as CDN (Download the required version and refer them locally. CDN is used for testing and are not recommended for production).

Download the repo, and set a  http server to view the charts in your browser.

__NOTE:__
For latest updates, include this repo as a submodule in any project by using following command:
`git submodule add https://github.com/qcrisw/d3ReusableCharts`

And include the following command in README of your project repo, to clone the entire project along with the submodule:
`git submodule update --init --recursive`

To update the submodule to recent commit, navigate to the submodule folder and type:
'git pull'

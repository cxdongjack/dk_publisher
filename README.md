# 需要在dk_publiser目录下启动grunt

# command example:
  # 全文件夹发布
  grunt --gruntfile publish.js --base ./example
  # 单文件发布
  grunt --gruntfile publish.js --base ./example single --target act_hello.js

# --base 指定的目录可以为绝对或相对路径

# 每个目标项目需要package.json来定制差异化需求
	include : 指定core文件需要包含的文件
	exclude : 指定core文件需要去除的文件
  prefix  : 顶级路径的前缀, 如static/page路径中的static
  target  : 顶级路径的目标目录, 如static/page路径中的page
  其余项同seajs

# try grunt --gruntfile publish.js --base ./example !

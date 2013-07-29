# dk_publisher
  为seajs项目的所有脚本提供一键打包

## 常用命令:
``` shell
  # 全项目发布
  grunt --gruntfile publish.js --base ./example
  # 单文件发布
  grunt --gruntfile publish.js --base ./example single --target act_hello.js
```


## 注意事情
1. 需要在dk_publiser目录下启动grunt
2. --base 指定的目录可以为绝对或相对路径
3. 每个目标项目需要package.json来定制差异化需求
	include : 指定core文件需要包含的文件
	exclude : 指定core文件需要去除的文件
	prefix  : 顶级路径的前缀, 如static/page路径中的static
	target  : 需要分析的目标目录, 如static/page路径中的page
  其余项同seajs(paths, vars等)
4. <--base>\/<prefix>\/<target>\/<filename> 等于文件的实际路径

## 重中之重
``` shell
grunt --gruntfile publish.js --base ./example
```
然后看example...


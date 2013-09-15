# dk_publisher
  为seajs项目的所有脚本提供一键打包

## 常用命令:
进入到项目package.json目录下, 运行以下命令
``` shell
  # 全项目打包
  dk press
  # core文件打包
  dk press --core
  # 单文件发布
  dk press --single <js_basename>
```

## 注意事情
1. 需要进入防止项目配置文件(package.json)所在目录
2. 每个目标项目需要package.json来定制差异化需求
  * include : 指定core文件需要包含的文件  
  * exclude : 指定core文件需要去除的文件
  * prefix  : 顶级路径的前缀, 如static/page路径中的static
  * target  : 需要分析的目标目录, 如static/page路径中的page
  * 其余项同seajs(paths, vars等)
3. base/prefix/target/filename 等于文件的实际路径

## 重中之重
``` shell
dk press -h
```


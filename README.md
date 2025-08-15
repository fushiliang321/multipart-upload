## 分片上传
支持基于分片的断点续传和文件缓存。
要求必须在安全上下文（Secure Context）的浏览器环境中使用。


[demo](https://github.com/fushiliang321/multipart-upload-demo)

#### 使用说明

**1、简单分片上传**
``` javascript
import multipartUpload from 'multipart-upload-zct'
import { group } from 'multipart-upload-zct/cache'

//传递给适配器的配置项
const adapterConfig = {
    ... //根据具体适配器需要传递的配置项进行填写
    baseURL:'http://127.0.0.1:8080',
    headers: {
        'Content-Type': 'application/json'
    },
}
//文件缓存，可不传，类型：CacheInterface
const cache = group('fileCache')
//文件对象，类型：Blob|FileStreamInterface
const file = new File([], 'fileName')
//自定义请求参数
const requestParams = {
    ... // 根据具体接口需要的参数进行填写
}
/**
 * 实例化上传对象
 * adapterConfig：可不传
 * cache：可不传，不传使用默认配置
 */
const mu = multipartUpload(adapterConfig, cache)
/**
 * 上传文件
 * file：必传
 * requestParams：可不传
 */
const result = await mu.upload(file, requestParams)
```

**2、请求适配器**
请求适配器封装了多种不同的底层请求方法，可以根据项目需求选择合适的适配器。
目前内置三种请求适配器可选，分别为：fetchAdapter（默认）、axiosAdapter、uniAdapter，也可以自行实现requestAdapterInterface接口来自定义适配器。
``` javascript
import {
    MultipartUpload,
    axiosMultipartUpload,
    fetchMultipartUpload,
    uniMultipartUpload
} from 'multipart-upload-zct'
import requestAdapter from 'multipart-upload-zct/requestAdapters/fetchAdapter'
// import requestAdapter from 'multipart-upload-zct/requestAdapters/axiosAdapter'
// import requestAdapter from 'multipart-upload-zct/requestAdapters/uniAdapter'

//方式一、手动实例化适配器，推荐使用自定义适配器时使用
/**
 * 请求适配器
 * adapterConfig：可不传
 */
const adapter = new requestAdapter(adapterConfig)
/**
 * adapter：必传
 * cache：可不传，不传使用默认配置
 */
const mu = new MultipartUpload(adapter, cache)

//方式二、快捷使用内置适配器
/**
 * adapterConfig：可不传
 * cache：可不传，不传使用默认配置
 */
const mu = new fetchMultipartUpload(adapterConfig, cache)
// const mu = new axiosMultipartUpload(adapterConfig, cache)
// const mu = new uniMultipartUpload(adapterConfig, cache)
```

**3、上传事件监听**
``` javascript
...
const task = mu.upload(file, requestParams)
//上传进度监听
task.onUploadProgress(e => {
    /**
        e = {
            status: statusTags,  // 上传状态
            progress: number, // 上传进度
            total: number, // 总大小
            loaded: number, // 已上传大小
        }
     */
    ...
})

//上传完成监听
task.success(data => {
    // data为complete接口执行成功后的响应数据
    ...
})
//返回结果，result同上面的data
const result = await task
```

**3、从缓存中恢复上传任务对象**
``` javascript
import { restoreToMultipartUpload } from 'multipart-upload-zct'

/**
 * adapter：请求适配器，不传使用默认配置
 * cache：文件缓存，不传使用默认配置
 */
const tasks = await restoreToMultipartUpload(adapter, cache)
```

**4、其他操作**
``` javascript
const task = mu.upload(file, requestParams)
//中断上传
task.abort()
//恢复上传
task.resume()
//清除文件缓存
task.clearCache()
```

#### 配置

**1、配置信息获取与设置**
``` javascript
import { get, set } from 'multipart-upload-zct/config'
import { get as cacheGet, set as cacheSet } from 'multipart-upload-zct/cache'

// 获取全局配置
const config = get()
// 设置全局配置
set(config)

// 获取缓存配置
const config = cacheGet()
// 设置缓存配置
cacheSet(config)
```

**2、全局配置说明**
|配置名称|类型|默认值|说明|
| - | - | - | - |
|api|{<br>init: string, <br> part: string,<br> complete: string<br>}|{<br>init: 'multipart/init',<br>part: 'multipart/part',<br> complete: 'multipart/complete',<br>}|接口配置，需根据实际项目接口调整<br>init：初始化接口；<br>part：上传分片接口；<br>complete：合并分片接口；<br>上传流程：初始化接口->分片上传->合并分片|
|maxPartSize|number|5 * 1024 * 1024|单个分片的最大字节数，如果初始化接口响应了该值，则使用接口响应的值|
|maxFileSize|number|200 * 1024 * 1024|文件的最大字节数，如果初始化接口响应了该值，则使用接口响应的值|
|retryNum|number|5|失败重试次数|
|retryInterval|number|1000|失败重试间隔（毫秒）|
|concurrency|number|1|分片并发上传数量|
|isCheckoutFileHash|boolean|true|是否校验文件hash值|
|fileHashMode|string|MD5|文件hash值计算方式，支持：MD5、SHA-1、SHA-256、SHA-384、SHA-512|
|assureCacheFileWriteSequence|boolean|true|是否需要保证缓存文件写入顺序|
|speedLimit|number||限速，0表示不限速|
|requestAdapter|new(config: object) => requestAdapterInterface|fetchAdapter|默认的请求适配器|
|fileCache|CacheInterface / false|group('defaultFileCache')|默认的文件缓存，不使用缓存传：false|


**3、缓存配置说明**


|配置名称|类型|默认值|说明|
| - | - | - | - |
|reservation|number| 1024 * 1024 * 10 | 缓存预留空间（字节），防止缓存把磁盘空间占满 |
|mode|string| auto | 缓存模式<br>auto：自动；<br>opfs：使用源私有文件系统；<br>indexedDB：使用indexedDB |
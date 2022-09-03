<template>
  <el-form ref="postForm" :model="postForm" :rules="rules">
    <sticky :class-name="'sub-navbar ' + postForm.status">
      <el-button v-if="!isEdit" @click="showGuide">显示帮助</el-button>
      <el-button
        v-loading="loading"
        type="success"
        style="margin-left: 20px"
        @click="submitForm"
      >
        {{ isEdit ? '编辑电子书':'新增电子书' }}
      </el-button>
    </sticky>
    <div class="detail-container">
      <el-row>
        <Warning />
        <el-col :span="24">
          <!-- 上传控件的具体样式 -->
          <EbookUpload
            :file-list="fileList"
            :disabled="isEdit"
            @onSuccess="onUploadSuccess"
            @onRemove="onUploadRemove"
          />
          <!-- :disabled="isEdit" 表示当在/creat上传页面时，上传控件可以使用；当在/edit编辑页面时，上传控件不可以使用 -->
        </el-col>
        <el-col :span="24">
          <!-- 电子表单 -->
          <el-form-item prop="title">
            <MdInput v-model="postForm.title" :maxlength="100" name="name" required>
              书名
            </MdInput>
          </el-form-item>
          <!-- 作者、出版社 -->
          <el-row>
            <el-col :span="12">
              <el-form-item prop="author" label="作者: " :label-width="labelWidth">
                <el-input
                  v-model="postForm.author"
                  placeholder="作者"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="publisher" label="出版社: " :label-width="labelWidth">
                <el-input
                  v-model="postForm.publisher"
                  placeholder="出版社"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <!-- 语言、根文件 -->
          <el-row>
            <el-col :span="12">
              <el-form-item prop="language" label="语言: " :label-width="labelWidth">
                <el-input
                  v-model="postForm.language"
                  placeholder="语言"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="rootFile" label="根文件: " :label-width="labelWidth">
                <el-input
                  v-model="postForm.rootFile"
                  placeholder="根文件"
                  disabled
                />
              </el-form-item>
            </el-col>
          </el-row>
          <!-- 文件路径、解压路径 -->
          <el-row>
            <el-col :span="12">
              <el-form-item prop="filePath" label="文件路径: " :label-width="labelWidth">
                <el-input
                  v-model="postForm.filePath"
                  placeholder="文件路径"
                  disabled
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="unzipPath" label="解压路径: " :label-width="labelWidth">
                <el-input
                  v-model="postForm.unzipPath"
                  placeholder="解压路径"
                  disabled
                />
              </el-form-item>
            </el-col>
          </el-row>
          <!-- 封面路径、文件名称 -->
          <el-row>
            <el-col :span="12">
              <el-form-item prop="coverPath" label="封面路径: " :label-width="labelWidth">
                <el-input
                  v-model="postForm.coverPath"
                  placeholder="封面路径"
                  disabled
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="originalName" label="文件名称: " :label-width="labelWidth">
                <el-input
                  v-model="postForm.originalName"
                  placeholder="文件名称"
                  disabled
                />
              </el-form-item>
            </el-col>
          </el-row>
          <!-- 封面图片 -->
          <el-row>
            <el-col :span="24">
              <el-form-item prop="cover" label="封面: " :label-width="labelWidth">
                <!-- a标签的作用是放大图片，当点击这个图片时，会新出来一个页面显示 -->
                <a v-if="postForm.cover" :href="postForm.cover" target="_blank">
                  <img :src="postForm.cover" class="preview-img">
                </a>
                <span v-else>无</span>
              </el-form-item>
            </el-col>
          </el-row>
          <!-- 目录组件 -->
          <el-row>
            <el-col :span="24">
              <el-form-item label="目录: " :label-width="labelWidth">
                <div v-if="contentsTree && contentsTree.length > 0" class="contents-wrapper">
                  <el-tree :data="contentsTree" @node-click="onContentClick" />
                </div>
                <span v-else>无</span>
              </el-form-item>
            </el-col>
          </el-row>
          <!--  -->
        </el-col>
      </el-row>
    </div>
  </el-form>
</template>

<script>
import Sticky from '../../../components/Sticky'
import Warning from './Warning.vue'
import EbookUpload from '../../../components/EbookUpload'
import MdInput from '../../../components/MDinput'
import { createBook, getBook, updateBook } from '../../../api/book'

// const defaultForm = {
//   title: '',
//   author: '',
//   publisher: '',
//   language: '',
//   rootFile: '',
//   cover: '',
//   url: '',
//   originalName: '',
//   fileName: '',
//   coverPath: '',
//   filePath: '',
//   unzipPath: ''
// }

// 字段映射，方便前端页面阅读
const fields = {
  title: '书名',
  author: '作者',
  publisher: '出版社',
  language: '语言'
}

export default {
  components: { Sticky, Warning, EbookUpload, MdInput },
  props: {
    isEdit: Boolean
  },
  data() {
    const validateRequire = (rule, value, callback) => {
      // console.log('validateRequire::', rule, value)
      // value是该表单提交的内容
      // rules是{field: 'title', fullField: 'title', type: 'string', validator: ƒ}
      // 无论是否校验成功都要调用回调函数
      if (value.length === 0) {
        callback(new Error(fields[rule.field] + '必须填写'))
      } else {
        callback() // 继续往后执行
      }
    }
    return {
      loading: false,
      postForm: {},
      // 默认空数组。当我们编辑的时候，获取到电子书时，就把它放到该数组
      fileList: [],
      labelWidth: '120px',
      contentsTree: [],
      rules: {
        title: [{ validator: validateRequire }],
        author: [{ validator: validateRequire }],
        publisher: [{ validator: validateRequire }],
        language: [{ validator: validateRequire }]
      }
    }
  },
  created() {
    if (this.isEdit) {
      const fileName = this.$route.params.fileName
      this.getBookData(fileName)
    }
  },
  methods: {
    getBookData(fileName) {
      getBook(fileName).then(response => {
        this.setData(response.data)
      })
    },
    onContentClick(data) {
      // el-tree规定的触发事件，可以穿进3个参数（传递给data属性的数组中该节点所对应的对象、节点对应的node、节点组件本身）
      // console.log(data)
      if (data.text) {
        window.open(data.text)
      }
    },
    setDefault() {
      // 将postForm置为空对象，并给赋予默认值defaultForm
      // this.postForm = Object.assign({}, defaultForm)
      // 使用上面的defaultForm方法无法清空表单验证内容，因此使用表单自带的方法resetFields
      // resetFields 对整个表单进行重置，将所有字段值重置为初始值并移除校验结果
      // 只有prop属性的表单才能被清空，需要给每个表单项添加prop属性
      this.$refs.postForm.resetFields()
      // 清空显示的目录
      this.contentsTree = []
      // 清空上传窗口上传的文件
      this.fileList = []
    },
    setData(data) {
      // 更新表单数据
      const { title, author, publisher, language, rootFile, cover, url, originalName, contents, contentsTree, fileName, coverPath, filePath, unzipPath } = data
      this.postForm = {
        ...this.postForm,
        title,
        author,
        publisher,
        language,
        rootFile,
        cover,
        url,
        originalName,
        contents,
        contentsTree,
        fileName,
        coverPath,
        filePath,
        unzipPath
      }
      this.contentsTree = contentsTree
      this.fileList = [{ name: originalName || fileName, url }]
    },
    showGuide() {
      console.log('show guide ...')
    },
    submitForm() {
      const onSuccess = (response) => {
        const { msg } = response
        this.$notify({
          title: '操作成功',
          message: msg,
          type: 'success',
          duration: 2000
        })
        this.loading = false
      }
      // if (this.$refs.postForm) {
      //   this.loading = false
      // }
      if (!this.loading) {
        this.loading = true
        this.$refs.postForm.validate((valid, fields) => {
          // fields就是data里面定义的rules对象
          // 依次遍历所以fields下面的rules，发现validator里面有校验规则后就会执行赋给他的validateRequire方法
          // 当valid为false时，fields会返回定义好的错误原因
          console.log('validate::', valid, fields)
          if (valid) {
            // 表单验证通过：
            // postForm中有些内容不需要上传服务端，但是直接删除会影响界面显示，因此需要做一个浅拷贝。
            // 浅拷贝法1：
            const book = Object.assign({}, this.postForm)
            // 浅拷贝法2：const book = {...this.postForm}
            // delete book.contents
            delete book.contentsTree
            // console.log(book)
            if (!this.isEdit) {
              // 如果this.isEdit为false，说明是 新增 。
              // 调用接口
              createBook(book).then(response => {
                // console.log('createBook response: ', response)
                // const { msg } = response
                // this.$notify({
                //   title: '操作成功',
                //   message: msg,
                //   type: 'success',
                //   duration: 2000
                // })
                // this.loading = false
                onSuccess(response)
                this.setDefault()
              }).catch(() => {
                this.loading = false
              })
            } else {
              updateBook(book).then(response => {
                onSuccess(response)
              }).catch(() => {
                this.loading = false
              })
            }
          } else {
            // 表单验证未通过：
            // Object.keys(fields) 拿到fields里面的所以属性并输出为数组
            // Object.keys(fields)[0]将数组中第一个属性获取
            // 拿到的第一个属性是个数组，因为可能命中多个错误，所以再取第一个
            const message = fields[Object.keys(fields)[0]][0].message
            this.$message({
              message,
              type: 'error'
            })
            this.loading = false
          }
        })
      }
    },
    onUploadSuccess(data) {
      // console.log('onUploadSuccess', data)
      this.setData(data)
    },
    onUploadRemove() {
      // console.log('onUploadRemove')
      this.setDefault()
    }
  }
}
</script>

<style lang="scss" scoped>
  .detail-container {
    padding: 40px 50px 20px;
    .preview-img {
      widows: 270px;
      height: 270px;
    }
  }
</style>

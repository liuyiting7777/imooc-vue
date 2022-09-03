<template>
  <div class="app-container">
    <!-- 查询条件 -->
    <div class="filter-container">
      <el-input
        v-model="listQuery.title"
        placeholder="书名"
        style="width: 200px"
        class="filter-item"
        clearable
        @keyup.enter.native="handleFilter"
        @clear="handleFilter"
        @blur="handleFilter"
      />
      <el-input
        v-model="listQuery.author"
        placeholder="作者"
        style="width: 200px"
        class="filter-item"
        clearable
        @keyup.enter.native="handleFilter"
        @clear="handleFilter"
        @blur="handleFilter"
      />
      <el-select
        v-model="listQuery.category"
        placeholder="分类"
        clearable
        class="filter-item"
        @change="handleFilter"
      >
        <el-option
          v-for="item in categoryList"
          :key="item.value"
          :label="item.label + '(' + item.num + ')'"
          :value="item.label"
        />
      </el-select>
      <el-button
        v-waves
        class="filter-item"
        type="primary"
        icon="el-icon-search"
        style="margin-left: 10px"
        @click="handleFilter"
      >
        查询
      </el-button>
      <el-button
        v-waves
        class="filter-item"
        type="primary"
        icon="el-icon-edit"
        style="margin-left: 5px"
        @click="handleCreate"
      >
        新增
      </el-button>
      <el-checkbox
        v-model="showCover"
        class="filter-item"
        style="margin-left: 5px"
        @change="changeShowCover"
      >
        显示封面
      </el-checkbox>
    </div>
    <!-- 表格组件 -->
    <!-- border表格带边框,fit表格自适应,highlight-current-row当前选择行高亮 -->
    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%"
      :default-sort="defaultSort"
      @sort-change="sortChange"
    >
      <el-table-column
        label="ID"
        prop="id"
        sortable="custom"
        align="center"
        width="80"
      />
      <el-table-column
        label="书名"
        width="150"
        align="center"
      >
        <template v-slot="{ row: { titleWrapper } }">
          <!-- <span>{{ titleWrapper }}</span> -->
          <span v-html="titleWrapper" />
        </template>
      </el-table-column>
      <el-table-column
        label="作者"
        width="150"
        align="center"
      >
        <template v-slot="{ row: { authorWrapper } }">
          <!-- <span>{{ authorWrapper }}</span> -->
          <span v-html="authorWrapper" />
        </template>
      </el-table-column>
      <el-table-column label="出版社" prop="publisher" width="150" align="center" />
      <el-table-column label="分类" prop="categoryText" width="100" align="center" />
      <el-table-column label="语言" prop="language" align="center" />
      <el-table-column
        v-if="showCover"
        label="封面"
        width="150"
        align="center"
      >
        <!-- scope这个字段可以结构为 { row: { cover } } -->
        <template slot-scope="{ row: { cover } }">
          <a :href="cover" target="_blank">
            <img :src="cover" style="width: 120px; height: 180px;">
          </a>
        </template>
      </el-table-column>
      <el-table-column label="文件名" prop="fileName" width="100" align="center" />
      <el-table-column label="文件路径" prop="filePath" width="100" align="center">
        <template slot-scope="{ row: {filePath} }">
          <span>{{ filePath | valueFilter }}</span>
        </template>
      </el-table-column>
      <el-table-column label="封面路径" prop="coverPath" width="100" align="center">
        <template slot-scope="{ row: {coverPath} }">
          <span>{{ coverPath | valueFilter }}</span>
        </template>
      </el-table-column>
      <el-table-column label="解压路径" prop="unzipPath" width="100" align="center">
        <template slot-scope="{ row: {unzipPath} }">
          <span>{{ unzipPath | valueFilter }}</span>
        </template>
      </el-table-column>
      <el-table-column label="上传人" prop="createUser" width="100" align="center">
        <template slot-scope="{ row: {createUser} }">
          <span>{{ createUser | valueFilter }}</span>
        </template>
      </el-table-column>
      <el-table-column label="上传时间" prop="createDt" width="100" align="center">
        <template slot-scope="{ row: {createDt} }">
          <span>{{ createDt | timeFilter }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        width="120"
        align="center"
        fixed="right"
      >
        <template slot-scope="{ row }">
          <el-button type="text" icon="el-icon-edit" @click="handleUpdate(row)" />
          <el-button type="text" icon="el-icon-delete" style="color: #f56c6c;" @click="handleDelete(row)" />
        </template>
      </el-table-column>
    </el-table>
    <!--  -->
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.pageSize"
      @pagination="refresh"
    />
  </div>
</template>

<script>
import Pagination from '../../components/Pagination/index'
import waves from '../../directive/waves/waves'
import { getCategory, listBook, deleteBook } from '../../api/book'
import { parseTime } from '@/utils'
export default {
  components: { Pagination },
  directives: { waves },
  filters: {
    valueFilter(value) {
      return value || '无'
    },
    timeFilter(time) {
      return time ? parseTime(time, '{y}-{m}-{d} {h}:{i}') : '无'
    }
  },
  data() {
    return {
      tableKey: 0, // 存在多个table时，对table进行区分
      listLoading: true, // 为true时，表格处于加载状态
      listQuery: {}, // 包含一些查询条件的默认值(el-input里面输入的内容就在该对象内)
      showCover: false,
      categoryList: [],
      list: [], // 表格的数据源，通过接口获取到的表格数据就放在这个数组内
      total: 0,
      defaultSort: {}
    }
  },
  created() {
    this.parseQuery()
  },
  mounted() {
    this.getList()
    this.getCategoryList()
  },
  beforeRouteUpdate(to, from, next) {
    console.log(to, from)
    // 如果跳转路由和之前的路径相同，但是query这个对象不同
    if (to.path === from.path) {
      const newQuery = Object.assign({}, to.query)
      const oldQuery = Object.assign({}, from.query)
      if (JSON.stringify(newQuery) !== JSON.stringify(oldQuery)) {
        // 一定要json化后再对比，否则要对对象逐一对比，难度大
        this.getList() // 因为之前调用的是refresh，当有新内容时还要重新调用getList。因为没有办法自动触发，所以放到路由钩子里面
      }
    }
    next()
  },
  methods: {
    parseQuery() {
      const query = Object.assign({}, this.$route.query) // 从this.$route.query里获取网页地址上的params，并存储为一个对象，命名为query。将其放到listQuery中
      let sort = '+id'
      // 对listQuery里面的参数进行解析
      const listQuery = {
        page: 1,
        pageSize: 20,
        sort
      }
      if (query) {
        query.page && (query.page = +query.page)
        query.page && (query.pageSize = +query.pageSize)
        query.sort && (sort = query.sort)
      }
      const sortSymbol = sort[0] // 得到的是升序或者降序
      const sortColumn = sort.slice(1, sort.length) // 得到的是id
      this.defaultSort = {
        // default-sort是el-table里面预留的接口，当传入这两个属性时，可以将页面上升降序标识的状态保持
        prop: sortColumn, // 指定默认要排序的列
        order: sortSymbol === '+' ? 'ascending' : 'descending' // 指定默认排序的顺序
      }
      // {  } 解构赋值时，同样属相，后面的会覆盖前面的
      this.listQuery = { ...listQuery, ...query } // 因为我们把query加进来了，所以网址上的参数也会自动填充到网页里对应的输入窗口中
      console.log('list.vue parseQuery', this.listQuery)
    },
    sortChange(data) {
      // 定义表格如何排序
      console.log('sortChange', data)
      const { prop, order } = data
      // 升序ascending由+id表示，降序descending由-id表示
      this.sortBy(prop, order)
    },
    sortBy(prop, order) {
      if (order === 'ascending') {
        this.listQuery.sort = `+${prop}` // 按照id进行升序排列
      } else {
        this.listQuery.sort = `-${prop}`
      }
      this.handleFilter()
    },
    wrapperKeyword(key, value) {
      // 高亮
      function highlight(value) {
        return `<span style="color: #1890ff;">${value}</span>`
      }
      if (!this.listQuery[key]) {
        return value
      } else {
        // 箭头函数中如果直接写一个function，那么会直接把它return;
        // i不区分大小写，g全局性查询
        return value.replace(new RegExp(this.listQuery[key], 'ig'), value => highlight(value))
      }
    },
    getList() {
      this.listLoading = true
      //   console.log('list.vue method: getList 1:this.listQuery', this.listQuery)
      listBook(this.listQuery).then(response => {
        // console.log('list.vue method: getList 2:response.data', response.data)
        const { list, count } = response.data
        this.list = list
        this.total = count
        this.listLoading = false
        this.list.forEach(book => {
          book.titleWrapper = this.wrapperKeyword('title', book.title) // 给book添加一个新属性titleWrapper
          book.authorWrapper = this.wrapperKeyword('author', book.author) // 同理
        })
      })
    },
    getCategoryList() {
      getCategory().then(response => {
        this.categoryList = response.data
      })
    },
    refresh() {
      // 刷新时保留网页中的参数
      this.$router.push({
        path: '/book/list',
        query: this.listQuery
      })
    },
    handleFilter() {
      console.log('list.vue method: handleFilter', this.listQuery)
      this.listQuery.page = 1 // 每次我们进行条件查询的时候，都要讲页码变为1
      //   this.getList()
      this.refresh()
    },
    handleCreate() {
      this.$router.push('/book/create')
    },
    handleUpdate(row) {
      console.log('handleUpdate', row)
      this.$router.push(`/book/edit/${row.fileName}`)
    },
    handleDelete(row) {
      //   console.log('handleDelete', row)
      //  关于$confirm这个官方提供插件的内容官网可以查到，其会返回一个promise对象
      this.$confirm('此操作将永久删除该电子书，是否继续？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // then里面是点击确定后的内容，catch是点击取消后的内容（且取消会默认把confirm关掉），这里我们只用then
        deleteBook(row.fileName).then(response => {
          // 官方方法，右侧弹出提示窗
          this.$notify({
            title: '成功',
            message: response.msg || '删除成功',
            type: 'success',
            duration: 2000
          })
          this.handleFilter()
        })
      })
    },
    changeShowCover(value) {
      this.showCover = value
    }
  }
}
</script>

<style lang="scss" scoped>
</style>

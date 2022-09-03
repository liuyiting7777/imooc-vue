import request from '@/utils/request'

export function getRoutes() {
  return request({
    // url: '/vue-element-admin/routes',
    url: '/routes',
    method: 'get'
  })
}

export function getRoles() {
  return request({
    // url: '/vue-element-admin/roles',
    url: '/roles',
    method: 'get'
  })
}

export function addRole(data) {
  return request({
    // url: '/vue-element-admin/role',
    url: '/role',
    method: 'post',
    data
  })
}

export function updateRole(id, data) {
  return request({
    // url: `/vue-element-admin/role/${id}`,
    url: `/role/${id}`,
    method: 'put',
    data
  })
}

export function deleteRole(id) {
  return request({
    // url: `/vue-element-admin/role/${id}`,
    url: `/role/${id}`,
    method: 'delete'
  })
}

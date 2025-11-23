// 诊断工具：检查 Supabase 连接和配置
import { supabase } from '../lib/supabase'

export const diagnoseSupabase = async () => {
  const results = {
    supabaseClient: false,
    envConfig: false,
    connection: false,
    tables: {
      posts: false,
      users: false,
      comments: false
    },
    rls: {
      posts: null,
      users: null,
      comments: null
    },
    errors: []
  }

  console.log('🔍 开始诊断 Supabase 配置...')

  // 1. 检查 Supabase 客户端
  if (supabase) {
    results.supabaseClient = true
    console.log('✅ Supabase 客户端已初始化')
  } else {
    results.errors.push('Supabase 客户端未初始化，请检查环境变量')
    console.error('❌ Supabase 客户端未初始化')
    return results
  }

  // 2. 检查环境变量
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  if (supabaseUrl && supabaseKey && 
      supabaseUrl !== 'YOUR_SUPABASE_URL' && 
      supabaseKey !== 'YOUR_SUPABASE_ANON_KEY' &&
      supabaseUrl.startsWith('http')) {
    results.envConfig = true
    console.log('✅ 环境变量配置正确')
  } else {
    results.errors.push('环境变量配置不正确')
    console.error('❌ 环境变量配置不正确')
  }

  // 3. 测试连接
  try {
    const { data, error } = await supabase.auth.getSession()
    if (!error) {
      results.connection = true
      console.log('✅ Supabase 连接正常')
    } else {
      results.errors.push(`连接测试失败: ${error.message}`)
      console.error('❌ 连接测试失败:', error)
    }
  } catch (err) {
    results.errors.push(`连接异常: ${err.message}`)
    console.error('❌ 连接异常:', err)
  }

  // 4. 测试网络请求
  console.log('\n🌐 测试网络请求...')
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  if (supabaseUrl) {
    try {
      const testUrl = `${supabaseUrl}/rest/v1/posts?select=*&limit=1`
      console.log('📡 测试请求 URL:', testUrl)
      
      const startTime = Date.now()
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || ''}`,
          'Content-Type': 'application/json'
        }
      })
      const endTime = Date.now()
      
      console.log(`⏱️ 请求耗时: ${endTime - startTime}ms`)
      console.log('📊 响应状态:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ 请求失败，响应内容:', errorText.substring(0, 200))
        results.errors.push(`网络请求失败: ${response.status} ${response.statusText}`)
      } else {
        console.log('✅ 网络请求成功')
      }
    } catch (networkErr) {
      console.error('❌ 网络请求异常:', networkErr)
      results.errors.push(`网络请求异常: ${networkErr.message}`)
      console.error('💡 这可能是 CORS 问题或网络连接问题')
    }
  }

  // 5. 检查表是否存在
  const tables = ['posts', 'users', 'comments']
  
  for (const table of tables) {
    try {
      console.log(`\n🔍 检查表 ${table}...`)
      const startTime = Date.now()
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      const endTime = Date.now()
      console.log(`⏱️ 查询耗时: ${endTime - startTime}ms`)

      if (error) {
        if (error.code === 'PGRST116') {
          results.errors.push(`表 ${table} 不存在`)
          console.error(`❌ 表 ${table} 不存在`)
        } else if (error.code === '42501') {
          results.tables[table] = true // 表存在，但可能没有权限
          results.rls[table] = '可能被 RLS 策略阻止'
          results.errors.push(`表 ${table} 存在但可能被 RLS 策略阻止: ${error.message}`)
          console.warn(`⚠️ 表 ${table} 存在但可能被 RLS 策略阻止`)
          console.warn(`   错误代码: ${error.code}`)
          console.warn(`   错误信息: ${error.message}`)
          console.warn(`   💡 解决方案: 在 Supabase SQL Editor 中运行 fix_database_rls.sql`)
        } else {
          results.errors.push(`查询表 ${table} 时出错: ${error.message}`)
          console.error(`❌ 查询表 ${table} 时出错:`, error)
          console.error(`   错误代码: ${error.code}`)
          console.error(`   错误详情:`, error)
        }
      } else {
        results.tables[table] = true
        console.log(`✅ 表 ${table} 可访问，返回 ${data?.length || 0} 条记录`)
      }
    } catch (err) {
      results.errors.push(`检查表 ${table} 时发生异常: ${err.message}`)
      console.error(`❌ 检查表 ${table} 时发生异常:`, err)
    }
  }

  // 5. 输出诊断结果
  console.log('\n📊 诊断结果:')
  console.log('Supabase 客户端:', results.supabaseClient ? '✅' : '❌')
  console.log('环境变量配置:', results.envConfig ? '✅' : '❌')
  console.log('连接状态:', results.connection ? '✅' : '❌')
  console.log('\n表访问状态:')
  Object.entries(results.tables).forEach(([table, accessible]) => {
    console.log(`  ${table}:`, accessible ? '✅' : '❌')
    if (results.rls[table]) {
      console.log(`    ⚠️ ${results.rls[table]}`)
    }
  })

  if (results.errors.length > 0) {
    console.log('\n❌ 发现的问题:')
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`)
    })
  } else {
    console.log('\n✅ 所有检查通过！')
  }

  return results
}

// 在浏览器控制台中运行诊断
if (typeof window !== 'undefined') {
  window.diagnoseSupabase = diagnoseSupabase
  console.log('💡 提示: 在控制台运行 diagnoseSupabase() 来诊断问题')
}


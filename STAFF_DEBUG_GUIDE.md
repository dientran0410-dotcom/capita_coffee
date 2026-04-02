# Staff Creation & Display - Debugging Guide

## Problema Atual
- ✅ Tài khoản staff được tạo thành công
- ✅ Toast message "Tạo tài khoản nhân viên thành công!" hiển thị
- ✅ Chuyển hướng đến `/manager/staff`
- ❌ Nhưng staff không hiển thị trong danh sách
- ❌ Console hiển thị nhiều lỗi 404

## Console Logs Para Monitorizar

Khi bấm "Create Account & Staff", abra o DevTools Console e procure por estes logs:

### 1. **Staff Creation Flow** (CreateStaff.tsx)
```javascript
// Você deve ver:
🔐 Creating staff account with form data: {name, email, branchId, phone}
✅ Full response from API: {...}
📊 Extracted response data: {...}
📋 Response has ID: true
🔄 Redirecting to staff list...
```

**O que verificar:**
- ✅ `branchId` na request é correto (não deve ser UUID vazio)
- ✅ Response tem `id` ou `user.id`
- ✅ Response não tem field `franchiseId` com UUID inválido

### 2. **Staff List Fetch** (StaffList.tsx)
```javascript
// Você deve ver:
🔍 Fetching staffs for branch: {branchId}
✅ Raw API response: {...}
📦 Response structure: {hasContent: true, ...}
🔹 First staff (full): {...}
📊 Stats: X with branchId, Y without
```

**O que verificar:**
- ✅ `branchId` está sendo passado corretamente
- ✅ Response .content possui array de staffs
- ✅ O novo staff criado aparece no array

### 3. **Erro 404 "Franchise not found"**
```javascript
// Este erro significa que a código está tentando carregar:
❌ GET /api/franchise-service/franchises/3fa85f64-5717-4562-b3fc-2c963f66afa6
❌ Status: 404 Not Found
```

**Causa possível:**
- Um staff object tem um `branchId` com UUID inválido ou placeholder
- Algum código está tentando buscar informações da franchise usando este ID ruim

## Passo-a-Passo para Debugar

### Passo 1: Verificar Response da Criação
```javascript
// No console do navegador, abra Network tab
// Procure por POST request: /api/auth-service/users/create-account
// Verifique o Response JSON:
{
  "data": {
    "id": "...",
    "email": "...",
    "name": "...",
    "franchiseId": "...",  // ← Verificar se é UUID válido
    ...
  }
}
```

### Passo 2: Verificar Fetch da Lista
```javascript
// No Network tab, procure por GET request: /api/shift-service/staffs
// Verifique se tem query param: ?branchId=...
// Response deve ter: {content: [{...}, {...}]}
```

### Passo 3: Verificar localStorage
```javascript
// No DevTools Console, execute:
console.log("Auth user:", localStorage.getItem("auth_user"));
console.log("User:", localStorage.getItem("user"));

// Você deve poder ver:
{
  "id": "...",
  "branchId": "...",  // ← Seu branch como manager
  "role": "manager",
  ...
}
```

## Possíveis Issues & Soluções

| Problema | Causa | Solução |
|----------|-------|--------|
| Staff não aparece após criar | API ainda não sincronizou | Aguardar 2-3 segundos ou clicar Refresh |
| Staff aparece com sinal "?" em branchId | Response tem branchId = null ou undefined | Verificar se franchiseId foi enviado corretamente na request |
| 404 "Franchise not found" no console | Código tentando buscar franchise com UUID inválido | Verificar qual file está fazendo este request (SearchStack no console) |
| Danh sách vazia mesmo com zoom | branchId do manager é diferente do branchId do staff | Verificar se ambos têm mesma franchiseId |
| Teste com admin's create staff | Verificar se admin consegue ver este staff | Se admin vê, issue é no filtro de branch |

## Modificações Realizadas

### 1. staffService.ts - getAllStaffs() 
```typescript
// ✅ Agora passa branchId como param
export async function getAllStaffs(
  page = 0,
  size = 10,
  branchId?: string  // ← Novo param
): Promise<Paginated<Staff>> {
  const params: Record<string, any> = { page, size };
  
  const branch = branchId || getBranchId();
  if (branch && branch !== DEFAULT_BRANCH_ID) {
    params.branchId = branch;  // ← Passado ao API
  }
  // ...
}
```

### 2. StaffList.tsx - fetchStaffs()
```typescript
// ✅ Agora obtém branchId e passa ao getAllStaffs()
const fetchStaffs = async () => {
  const branchId = getLoggedInBranchId();  // ← Novo
  const data = await getAllStaffs(0, 100, branchId);  // ← Novo param
};
```

### 3. managerStaffService.ts - Melhor logging
```typescript
// ✅ Agora loga estrutura da resposta para debug
export async function createManagerStaff(payload) {
  console.log("✅ Staff creation response:", result);
  console.log("📊 Response structure:", {
    hasData: ...,
    keys: Object.keys(result)
  });
}
```

## Next Steps

1. **Criar um staff de teste**
2. **Abrir DevTools Console**
3. **Procurar pelos logs mencionados acima**
4. **Screenshot do que você vê**
5. **Comparar com este guia**

## Pontos-Chave Para Verificar

### Request para criar staff:
```bash
POST /api/auth-service/users/create-account
{
  "email": "...",
  "password": "...",
  "name": "...",
  "franchiseId": "abc123"  # ← Deve ser ID válido da franchise
}
```

### Request para listar staff:
```bash
GET /api/shift-service/staffs?page=0&size=100&branchId=abc123
```

### Response esperado:
```json
{
  "content": [
    {
      "id": "...",
      "name": "Novo Staff",
      "email": "...",
      "branchId": "abc123",  # ← Deve coincidir com request
      "status": "ACTIVE"
    }
  ],
  "totalElements": 1,
  "totalPages": 1
}
```

## Se Ainda Não Funcionar

1. Verifique se o backend está retornando `branchId` na resposta de criação
2. Verifique se o backend está filtrando por `branchId` quando listar staffs
3. Teste sem filtro (remova `branchId` do request) para ver se todos os staffs aparecem
4. Se sim, issue é no backend (não filtra corretamente)
5. Se não, issue é na request structure

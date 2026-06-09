# Firebase Security Specifications

## 1. Data Invariants

1. **Schema Validation**: A `Convidado` document must contain exactly the defined attributes: `id` (string), `uuid` (string), `nome` (string), `telefone` (string), `email` (string), `cpf` (string), `codigoAntifraude` (string), `dataCadastro` (string), `statusConvite` (string), `statusEntrada` (string), and `horaEntrada` (string or null).
2. **Access State Integrity (Anti-State-Shortcutting)**: A general user can register for an invite, but the invite must initially be `'Ativo'` and `'Não utilizado'`. They cannot self-authorize a used ticket profile.
3. **Temporal Integrity**: `dataCadastro` must be a valid timestamp string. When confirming check-in, `horaEntrada` must match the server timestamp (`request.time`).
4. **Terminal State Locking**: Once a guest register is changed to `statusEntrada = 'Utilizado'`, it is terminal. It cannot be reverted back to `'Não utilizado'` by standard users.
5. **No Spoofing**: No anonymous user can alter a document's `uuid`, `cpf`, or `email` after creation.

---

## 2. The "Dirty Dozen" Payloads (Exploit Scenarios)

1. **Payload 1: Pre-Validated Access Bypass**
   - Create document with `statusEntrada` pre-initialized to `'Utilizado'` to confuse scanners.
2. **Payload 2: Shadow Field Injection**
   - Create document with extra field `isVIPAdmin: true` to hijack privilege checks.
3. **Payload 3: Identity Stealing (CPF Overwrite)**
   - Update someone else's document to swap the `cpf` with a new value.
4. **Payload 4: Reverting Terminal Entry State**
   - Reset `statusEntrada` from `'Utilizado'` back to `'Não utilizado'` to reuse a scanning ticket.
5. **Payload 5: Overriding Creation Dates**
   - Create a registration setting `dataCadastro` to 5 years ago, bypassing limits.
6. **Payload 6: Code Poisoning**
   - Injection of huge metadata (1MB) as `codigoAntifraude` to bloat index sizes.
7. **Payload 7: Relational Orphan Creation**
   - Write a guest entry with blank or invalid UUID that doesn't correspond to any valid entity.
8. **Payload 8: Status Escalation**
   - Change `statusConvite` directly to `'Ativo'` on a revoked/canceled ticket without operator permission.
9. **Payload 9: Backdated Temporal Spoofing**
   - Complete an entry check-in, providing a historic `horaEntrada` of the attacker's choosing.
10. **Payload 10: Private Email Scraping**
    - Anonymous global query scraping other guests' private emails and CPFs.
11. **Payload 11: Bulk Deletion Attack**
    - Send a request to delete all entries from the `/convidados` collection.
12. **Payload 12: Invalid Enum Spoofing**
    - Create a guest with status option `'Pendente'` instead of the strict `'Ativo'` / `'Cancelado'` enums.

---

## 3. High-Fidelity Security Assertions

Our `firestore.rules` will strictly target and prevent all 12 payloads described above or enforce permission denials immediately.

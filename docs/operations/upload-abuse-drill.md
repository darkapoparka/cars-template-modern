# Upload abuse drill

Run against synthetic accounts and an isolated storage namespace. Use inert test
files; do not upload malware to third-party storage.

Verify rejection of:

- Unsupported extension and MIME type.
- Extension, declared MIME, and file-signature mismatch.
- Empty file and file over the configured size limit.
- More files than the listing limit and account quota.
- Filename traversal, control characters, and duplicate-name collision.
- Cross-user or cross-organization attach, replace, and delete attempts.
- Reuse of an expired or already-consumed upload authorization.

Verify successful uploads have owner, listing, size, type, checksum/provider
reference, processing status, creation time, and cleanup state. Public rendering
must use provider-generated identifiers rather than user filenames.

After the drill, verify failed uploads created no durable listing media and no
orphaned blobs. Cleanup deletion requires explicit approval for the named test
namespace.

Reference: [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).


# Legacy Migration
The Legacy migration folder is to support data on previously created and out of date actors.

Once all actors have migrated to a version above the one denoted by the postpend on the file, we can remove the file, and any reference to it. 

* Every reference should have a `TODO: Migrate:` comment, to aid us do this.

* All files will end in a v#.js representing the last version number supported by the file. for instance something.v1.js would be used for v1 sheets but not v2 sheets.

versions have moved to major only semantics, as its just simpler to deal with internally in the code base.

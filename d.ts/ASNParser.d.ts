
declare module AssureNote {
    module WGSNParser {
        interface Parser {
            parse(source: string): AssureNote.WGSNParser.ParseResult;
        }

        interface ParseResult {
            revisions: Revision[];
        }

        interface Revision {
            header: RevisionHeader;
            nodes: Node[];
        }

        interface RevisionHeader {
            tags: { [index: string]: string };
            revision: number;
            modified: Date;
            user: string;
        }

        interface Node {
            depth: number;
            type: string;
            num: string;
            label: string;
            id: string;
            key: string;
            revision: NodeHistory;
            body: NodeLinePart[][];
        }

        interface NodeHistory {
            created: number;
            modified: number;
        }

        interface NodeLinePart {
            type: string;
            ref: string;
            name: string;
            value: string;
        }
    }
}

declare var WGSN : AssureNote.WGSNParser.Parser;

import type { Message } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_STYLE: Record<string, string> = {
  OPENED: "border-conf-high/40 text-conf-high",
  DELIVERED: "border-conf-high/30 text-text-2",
  FAILED: "border-conf-low/40 text-conf-low",
};

export function MessagesTable({ messages }: { messages: Message[] }) {
  const emails = messages.filter(
    (m) => m.channel === "EMAIL" && m.status !== "DRAFT",
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Email activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Step</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emails.slice(0, 30).map((message) => (
                <TableRow key={message.id}>
                  <TableCell>
                    <p className="text-sm font-medium">
                      {message.contact.firstName} {message.contact.lastName}
                    </p>
                    <p className="text-xs text-text-3">
                      {message.contact.company?.name}
                    </p>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-text-2 tnum">
                    {message.step?.order ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-64">
                    <p className="truncate text-sm text-text-2">{message.subject}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={STATUS_STYLE[message.status] ?? "text-text-2"}
                    >
                      {message.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {emails.length > 30 && (
          <p className="pt-2 text-center text-xs text-text-3">
            Showing the 30 most recent of {emails.length}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

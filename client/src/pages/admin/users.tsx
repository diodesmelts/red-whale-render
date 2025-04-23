import { useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, User, Shield, UserCog, Key } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export default function UsersManager() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all users (server-side API endpoint would be filtered for admins only)
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/admin/users");
        return await res.json();
      } catch (error) {
        // If the admin endpoint isn't implemented yet, return a message
        return [];
      }
    }
  });

  // Filter users based on search
  const filteredUsers = users.filter((user: any) => 
    user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to promote a user to admin
  const promoteToAdmin = async (userId: number) => {
    try {
      await apiRequest("PUT", `/api/admin/users/${userId}/promote`);
      toast({
        title: "Success",
        description: "User promoted to admin successfully",
      });
      // Invalidate the users query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to promote user to admin",
        variant: "destructive",
      });
    }
  };

  // Function to reset a user's password (would send reset email in production)
  const resetPassword = async (userId: number) => {
    try {
      await apiRequest("POST", `/api/admin/users/${userId}/reset-password`);
      toast({
        title: "Success",
        description: "Password reset request sent",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate password reset",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users Management</h1>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filter Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username, email or name..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Users</h2>
            <span className="text-sm text-muted-foreground">
              {filteredUsers.length} total
            </span>
          </div>
        </div>
        <Separator />
        
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading users...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="font-semibold text-xs">
                          {user.displayName ? user.displayName[0].toUpperCase() : user.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{user.displayName || user.username}</div>
                        <div className="text-xs text-muted-foreground">@{user.username}</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <Badge variant="default" className="bg-purple-600">
                          <Shield className="h-3 w-3 mr-1" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => promoteToAdmin(user.id)}
                          disabled={user.isAdmin}
                        >
                          <UserCog className="h-3.5 w-3.5 mr-1" />
                          Promote
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => resetPassword(user.id)}
                        >
                          <Key className="h-3.5 w-3.5 mr-1" />
                          Reset PW
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {users.length === 0 ? (
              <div className="flex flex-col items-center">
                <User className="h-8 w-8 mb-2 text-muted-foreground" />
                <p>User management API not yet implemented</p>
                <p className="text-sm">Check back after the admin API endpoints are created</p>
              </div>
            ) : (
              <p>No users found matching your search</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
using Flurl.Http;
using Chat.Models;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;
using System; 
using System.Collections.Generic;
using Newtonsoft.Json; 

namespace Chat.Services
{
    public class CouchDbService
    {
        private readonly string _couchDbUrl = "http://127.0.0.1:5984/";
        private readonly string _databaseName = "users";
        private readonly string _username = "Joshua"; 
        private readonly string _password = "1234"; 

        public CouchDbService()
        {
            EnsureDatabaseExists().Wait();
        }

        private async Task EnsureDatabaseExists()
        {
            try
            {
                await $"{_couchDbUrl}{_databaseName}"
                    .WithBasicAuth(_username, _password)
                    .GetAsync();
            }
            catch (FlurlHttpException ex)
            {
                if (ex.StatusCode == 404)
                {
                    await $"{_couchDbUrl}{_databaseName}"
                        .WithBasicAuth(_username, _password)
                        .PutAsync(null);
                }
                else
                {
                    Console.WriteLine($"Error ensuring database exists: {ex.Message}");
                    throw;
                }
            }
        }

        public async Task AddUserAsync(User user)
        {
            try
            {
                await $"{_couchDbUrl}{_databaseName}"
                    .WithBasicAuth(_username, _password)
                    .PostJsonAsync(user);
            }
            catch (FlurlHttpException ex)
            {
                Console.WriteLine($"Error adding user: {ex.Message}");
                throw;
            }
        }

        public async Task<UserDocument?> GetUserByEmailAsync(string email)
        {
            try
            {
                var query = new
                {
                    selector = new
                    {
                        Email = email
                    },
                    limit = 1
                };

                var rawResponse = await $"{_couchDbUrl}{_databaseName}/_find"
                    .WithBasicAuth(_username, _password)
                    .PostJsonAsync(query)
                    .ReceiveJson<CouchDbResponse<UserDocument>>();

                return rawResponse.docs.FirstOrDefault();
            }
            catch (FlurlHttpException ex)
            {
                Console.WriteLine($"Error fetching user by email: {ex.Message}");
                throw;
            }
        }


        public async Task<List<T>> ExecuteQueryAsync<T>(object query)
        {
            try
            {
                var rawResponse = await $"{_couchDbUrl}{_databaseName}/_find"
                    .WithBasicAuth(_username, _password)
                    .PostJsonAsync(query)
                    .ReceiveJson<CouchDbResponse<T>>();

                return rawResponse.docs;
            }
            catch (FlurlHttpException ex)
            {
                Console.WriteLine($"Error executing query: {ex.Message}");
                throw;
            }
        }

        public async Task<UserDocument?> GetUserByIdAsync(string id)
        {
            try
            {
                return await $"{_couchDbUrl}{_databaseName}/{id}"
                    .WithBasicAuth(_username, _password)
                    .GetJsonAsync<UserDocument>();
            }
            catch (FlurlHttpException ex) when (ex.StatusCode == 404)
            {
                return null;
            }
            catch (FlurlHttpException ex)
            {
                Console.WriteLine($"Error fetching user by ID: {ex.Message}");
                throw;
            }
        }

        public async Task UpdateUserAsync(UserDocument user)
        {
            try
            {
                await $"{_couchDbUrl}{_databaseName}/{user._id}"
                    .WithBasicAuth(_username, _password)
                    .PutJsonAsync(user);
            }
            catch (FlurlHttpException ex)
            {
                Console.WriteLine($"Error updating user: {ex.Message}");
                throw;
            }
        }

        public async Task DeleteUserAsync(string id, string rev)
        {
            try
            {
                if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(rev))
                {
                    throw new InvalidOperationException("Both _id and _rev must be provided for deletion.");
                }

                await $"{_couchDbUrl}{_databaseName}/{id}?rev={rev}"
                    .WithBasicAuth(_username, _password)
                    .DeleteAsync();
            }
            catch (FlurlHttpException ex)
            {
                Console.WriteLine($"Error deleting user: {ex.Message}");
                throw;
            }
        }

        public async Task<List<User>> GetAllUsersAsync()
        {
            try
            {
                var query = new
                {
                    selector = new { },
                    fields = new[] { "fullName", "Email", "Approved" }, 
                    limit = 1000 
                };

                var rawResponse = await $"{_couchDbUrl}{_databaseName}/_find"
                    .WithBasicAuth(_username, _password)
                    .PostJsonAsync(query)
                    .ReceiveJson<CouchDbResponse<User>>();

                return rawResponse.docs;
            }
            catch (FlurlHttpException ex)
            {
                Console.WriteLine($"Error retrieving all users: {ex.Message}");
                throw;
            }
        }





    }


    public class CouchDbResponse<T>
    {
        [JsonProperty("docs")]
        public List<T> docs { get; set; } = new List<T>();
    }
}

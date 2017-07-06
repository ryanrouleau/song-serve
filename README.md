
## SoundServe API Documentation ##

### **Library Management** ###

----------

Get a list of all the directories being served to the client, add a directory to be served to the client, remove a directory from being served to the client

----------
* **URL**

  /api/manage

* **Methods:**
  
  `GET`|`PUT`|`DELETE`

* **Data Params**
    * **GET**
    ```
    n/a
    ```
    * **PUT** --- add directory to library
    ```json
    {
        "absolutePath" : "<absolute path to directory>"
    }    
    ```
    * **DELETE** --- remove directory from library
    ```json
    {
        "absolutePath" : "<absolute path to directory>"
    }
    ```

* **Success Response:**
  * **GET**
        * Response Code: 200
        * Content:  
    ```json
    {
        "numberOfDirs" : "number of directories being served",
        "dirs" : [
            "<absolute path to dir 1>",
            "<absolute oath to dir 2>"
        ]
    }
    ```
    * **PUT**
        * Response Code: 200
        * Content:
    ```
    n/a
    ```
    * **DELETE**
        * Response Code: 200
        * Content:
    ```
    n/a
    ```
 
* **Error Response:**

    TBD


<br />
<br />

### **Get All Albums** ###

----------

Get a list of all the albums and their artwork currently in the music library.

----------
* **URL**

  /api/albums

* **Methods:**
  
  `GET`

* **Data Params**
    ```
    n/a
    ```

* **Success Response:**
    * Response Code: 200
    * Content:  
    ```json
    {
        "numberOfAlbums" : "number of albums in library",
        "albums" : [
            {
                "albumId" : "<album uid>",
                "albumName" : "<name of album>",
                "albumArtist" : "<album artist>",
                "albumArt" : {
                    "medium" : "<url to 64x64 album art>",
                    "large" : "<url to 174x174 album art>",
                    "extraLarge" : "<url to 300x300 album art>",
                    "mega" : "<url to 600x600 album art>"
                }
            }
        ]
    }
    ```
* **Error Response:**
TBD


<br />
<br />

### **Get All Artists** ###

----------

Get a list of all the artists and their image currently in the music library.

----------
* **URL**

  /api/artists

* **Methods:**
  
  `GET`

* **Data Params**
    ```
    n/a
    ```

* **Success Response:**
    * Response Code: 200
    * Content:  
    ```json
    {
        "numberOfArtists" : "<number of artists in library>",
        "artists": [
            {
                "artistId" : "<artist uid>",
                "artistName" : "<name of artist>",
                "artistArt" : {
                    "medium" : "<url to 64x64 artist art>",
                    "large" : "<url to 174x174 artist art>",
                    "extraLarge" : "<url to 300x300 artist art>",
                    "mega" : "<url to 600x600 artist art>"
                }
            }
        ]
    }
    ```
* **Error Response:**

TBD


<br />
<br />

### **Get All Songs in a Specific Album** ###

----------

Get a list of all the songs in a given album by an album uid which is returned by the */api/albums* method.

----------
* **URL**

  /api/album/{album uid}

* **Methods:**
  
  `GET`

* **Data Params**
    ```
    n/a
    ```

* **Success Response:**
    * Response Code: 200
    * Content:  
    ```json
    {
        "numberOfSongs" : "number of songs in album",
        "songs": [
            {
                "songId" : "<song uid>",
                "songName" : "<name of song>",
                "songDuration" : "<duration of song in format 1:23>"
            }
        ]
    }
    ```
* **Error Response:**

TBD


<br />
<br />

### **Get All Songs from a Specific Artist** ###

----------

Get a list of all the songs from a given artist by an artist uid which is returned by the */api/artists* method.

----------
* **URL**

  /api/artist/{artist uid}

* **Methods:**
  
  `GET`

* **Data Params**
    ```
    n/a
    ```

* **Success Response:**
    * Response Code: 200
    * Content:  
    ```json
    {
        "numberOfSongs" : "number of songs by artist",
        "songs": [
            {
                "songId" : "<song uid>",
                "songName" : "<name of song>",
                "songDuration" : "<duration of song in format 1:23>"
            }
        ]
    }
    ```
* **Error Response:**

TBD


<br />
<br />

### **Get the .mp3 File for a Specific Song** ###

----------

Get the .mp3 file from a given song uid which is given from either the */api/album/{album uid}* or */api/artist/{artist uid}* methods.

----------
* **URL**

  /api/song/{song uid}

* **Methods:**
  
  `GET`

* **Data Params**
    ```
    n/a
    ```

* **Success Response:**
    * Response Code: 200
    * Content:  
    `A .mp3 file with header content-type: 'audio/mpeg'`
* **Error Response:**

TBD

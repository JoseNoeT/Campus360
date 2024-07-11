$(document).ready(function(){
    $('#Contenido').validate({
        rules: {
            username: {
                required: true,
                minlength: 5
            },
            email: {
                required: true,
                email: true,
                minlength: 1
            },
            password: {
                required: true,
                minlength: 8
            }
        },
        messages: {
            username: {
                required: "Por favor, introduzca el nombre",
                minlength: "Debe tener un mínimo de 5 caracteres"
            },
            email: {
                required: "Por favor, introduzca el correo",
                minlength: "Debe ser un correo válido",
                email: "Debe ser un correo con formato válido"
            },
            password: {
                required: "Por favor, introduzca la contraseña",
                minlength: "Debe tener un mínimo de 8 caracteres"
            }
        },
        submitHandler: function(form) {
            saveUser();
            form.reset();
            return false;
        }
    });

    function saveUser() {
        var username = $('#username').val();
        var email = $('#email').val();
        var password = $('#password').val();
    
        var user = {
            username: username,
            email: email,
            password: password
        };
    
        fetch('/api/registro/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user),
        })
        .then(response => response.json())
        .then(data => {
            alert('Usuario creado con éxito');
            console.log(data); // Puedes mostrar la respuesta del servidor si lo deseas
        })
        .catch(error => {
            console.error('Error al crear usuario:', error);
            alert('Ocurrió un error al crear el usuario');
        });
    }
    
